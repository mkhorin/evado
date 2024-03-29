/**
 * @copyright Copyright (c) 2020 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('areto/base/Action');

module.exports = class SortRelatedAction extends Base {

    constructor (config) {
        super({
            template: 'sort',
            ...config
        });
    }

    async execute () {
        const {pid, rel} = this.getQueryParams();
        await this.setParentModel(pid);
        this.setRelation(rel);
        this.setOrderBehavior();
        if (this.isGetRequest()) {
            this.setRelationWith(rel);
            return this.renderOrder();
        }
        const {order} = this.getPostParams();
        await this.updateOrder(order);
        await this.send('Done');
    }

    async setParentModel (id) {
        this.parentModel = await this.controller.getModel({id});
        if (!this.parentModel) {
            throw new BadRequest('Parent object not found');
        }
    }

    setRelation (name) {
        this.relation = this.parentModel.getRelation(name);
        if (!this.relation) {
            throw new BadRequest('Relation not found');
        }
    }

    setRelationWith (name) {
        if (this.with?.hasOwnProperty(name)) {
            this.relation.with(this.with[name]);
        }
    }

    setOrderBehavior () {
        this.sortOrderBehavior = this.relation.model.getBehavior('sortOrder');
        if (!this.sortOrderBehavior) {
            throw new BadRequest('Invalid sort order behavior');
        }
    }

    updateOrder (data) {
        if (!data) {
            throw new BadRequest('Invalid order data');
        }
        for (const key of Object.keys(data)) {
            data[key] = parseInt(data[key]);
            if (!Number.isSafeInteger(data[key])) {
                throw new BadRequest('Invalid order number');
            }
        }
        return this.sortOrderBehavior.update(data);
    }

    async renderOrder () {
        let data = {
            parentModel: this.parentModel,
            relModel: this.relation.model,
            models: await this.findModels().all(),
            orderAttr: this.sortOrderBehavior.orderAttr
        };
        await this.filterModels(data);
        data.relController = data.relModel.createController();
        data.relController.assignSource(this.controller);
        const model = data.relController.createViewModel(this.template, {data});
        if (model) {
            await model.prepareModels(data.models);
            data = await model.getTemplateData();
        }
        const content = await data.relController.renderTemplate(this.template, data);
        this.send(content);
    }

    findModels () {
        return this.relation.order({
            [this.sortOrderBehavior.orderAttr]: 1
        });
    }

    filterModels (data) {
        data.models = this.filterOverriddenModels(data);
    }

    filterOverriddenModels ({models, orderAttr}) {
        const {overriddenBehavior} = this.sortOrderBehavior;
        if (!overriddenBehavior) {
            return models;
        }
        const result = [];
        for (const model of models) {
            const behavior = model.getBehavior(overriddenBehavior);
            if (!behavior.hasOriginal() || !behavior.attrs.includes(orderAttr)) {
                result.push(model);
            } else {
                const states = behavior.getStates();
                if (states[orderAttr] === true) {
                    result.push(model);
                }
            }
        }
        return result;
    }
};

const BadRequest = require('areto/error/http/BadRequest');