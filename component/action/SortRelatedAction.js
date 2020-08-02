/**
 * @copyright Copyright (c) 2020 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('areto/base/Action');

module.exports = class SortRelatedAction extends Base {

    async execute () {
        const {pid, rel} = this.getQueryParams();
        await this.setParentModel(pid);
        await this.setRelation(rel);
        if (this.isGet()) {
            this.setRelationWith(rel);
            return this.renderOrder();
        }
        await this.updateOrder(this.getPostParam('order'));
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
        this.sortOrderBehavior = this.relation.model.getBehavior('sortOrder');
        if (!(this.sortOrderBehavior instanceof SortOrderBehavior)) {
            throw new BadRequest('Invalid sort order behavior');
        }
    }

    setRelationWith (name) {
        if (this.with && this.with.hasOwnProperty(name)) {
            this.relation.with(this.with[name]);
        }
    }

    updateOrder (data) {
        if (!data) {
            throw new BadRequest('Invalid order data');
        }
        for (const key of Object.keys(data)) {
            data[key] = parseInt(data[key]);
            if (!Number.isInteger(data[key])) {
                throw new BadRequest('Invalid order number');
            }
        }
        return this.sortOrderBehavior.update(data);
    }

    async renderOrder () {
        let data = {
            'parentModel': this.parentModel,
            'relModel': this.relation.model,
            'models': await this.relation.order({[this.sortOrderBehavior.orderAttr]: 1}).all(),
            'orderAttr': this.sortOrderBehavior.orderAttr
        };
        await this.filterModels(data);
        data.relController = data.relModel.createController().assignSource(this.controller);
        const model = data.relController.createViewModel('sort', {data});
        if (model) {
            await model.prepareModels(data.models);
            data = await model.getTemplateData();
        }
        this.send(await data.relController.renderTemplate('sort', data));
    }

    filterModels (data) {
        data.models = this.filterOverriddenModels(data);
    }

    filterOverriddenModels ({models, orderAttr}) {
        if (!this.sortOrderBehavior.overriddenBehavior) {
            return models;
        }
        const result = [];
        for (const model of models) {
            const behavior = model.getBehavior(this.sortOrderBehavior.overriddenBehavior);
            const states = behavior.getStates();
            if (!behavior.hasOriginal() || !behavior.attrs.includes(orderAttr) || states[orderAttr] === true) {
                result.push(model);
            }
        }
        return result;
    }
};

const BadRequest = require('areto/error/http/BadRequest');
const SortOrderBehavior = require('areto/behavior/SortOrderBehavior');