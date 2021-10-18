/**
 * @copyright Copyright (c) 2021 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('areto/base/Action');

module.exports = class SortRelatedArrayAction extends Base {

    constructor (config) {
        super({
            template: 'sortArray',
            ...config
        });
    }

    async execute () {
        const {pid, rel} = this.getQueryParams();
        await this.setParentModel(pid);
        this.setRelation(rel);
        if (this.isGetRequest()) {
            this.setRelationWith(rel);
            return this.renderOrder();
        }
        await this.updateOrder(this.getPostParam('order'), rel);
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

    findModels () {
        return this.relation;
    }

    updateOrder (targets, attr) {
        const sources = this.parentModel.get(attr);
        if (!Array.isArray(sources)) {
            throw new BadRequest('Invalid parent value');
        }
        if (!Array.isArray(targets)) {
            throw new BadRequest('Invalid order data');
        }
        targets = MongoHelper.normalizeId(targets);
        if (MongoHelper.hasDiff(targets, sources)) {
            throw new BadRequest('Invalid order data');
        }
        return this.parentModel.directUpdate({[attr]: targets});
    }

    async renderOrder () {
        let data = {
            parentModel: this.parentModel,
            relModel: this.relation.model,
            models: await this.findModels().all()
        };
        data.relController = data.relModel.createController().assignSource(this.controller);
        const model = data.relController.createViewModel(this.template, {data});
        if (model) {
            await model.prepareModels(data.models);
            data = await model.getTemplateData();
        }
        this.send(await data.relController.renderTemplate(this.template, data));
    }
};

const BadRequest = require('areto/error/http/BadRequest');
const MongoHelper = require('areto/helper/MongoHelper');