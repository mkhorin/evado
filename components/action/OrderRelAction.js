'use strict';

const Base = require('areto/base/Action');

module.exports = class OrderRelAction extends Base {

    async execute () {
        let params = this.getQueryParams();
        await this.setParentClass(params.cls);
        await this.setParentModel(params.id);
        await this.setRelation(params.rel);
        if (this.isGet()) {
            return this.renderOrder();
        }
        await this.updateOrder(this.getPostParam('order'));
        await this.send('Done');
    }

    setParentClass (name) {
        try {
            this.ParentClass = require(this.controller.module.app.getPath(name));
        } catch (err) {
            throw new NotFound(`Class not found: ${name}`);
        }
        if (!(this.ParentClass.prototype instanceof ActiveRecord)) {
            throw new BadRequest(`Class is not ActiveRecord: ${name}`);
        }
    }

    async setParentModel (id) {
        this.parentModel = await this.ParentClass.findById(id).one();         
        if (!this.parentModel) {
            throw new NotFound('Model not found');
        }
    }

    setRelation (name) {
        this.relation = this.parentModel.getRelation(name);
        if (!this.relation) {
            throw new BadRequest('Relation not found');
        }
        this.orderBehavior = this.relation.model.getBehavior('order');
        if (!(this.orderBehavior instanceof OrderBehavior)) {
            throw new BadRequest('Invalid order behavior');
        }
    }

    updateOrder (data) {
        if (!data) {
            throw new BadRequest('Invalid order data');
        }
        for (let key of Object.keys(data)) {
            data[key] = parseInt(data[key]);
            if (!Number.isInteger(data[key])) {
                throw new BadRequest('Invalid order number');
            }
        }
        return this.orderBehavior.update(data);
    }

    async renderOrder () {
        let data = {
            'parentModel': this.parentModel,
            'relModel': this.relation.model,
            'models': await this.relation.order({[this.orderBehavior.orderAttr]: 1}).all(),
            'orderAttr': this.orderBehavior.orderAttr
        };
        data.relController = data.relModel.createController().assignSource(this.controller);
        let viewModel = data.relController.createViewModel('order', {data}), content;
        if (viewModel) {
            await viewModel.prepareModels(data.models);
            content = await data.relController.renderViewModel(viewModel, 'order', false);
        } else {
            content = await data.relController.renderTemplate('order', data, false);
        }
        return this.send(content);
    }
};

const ActiveRecord = require('areto/db/ActiveRecord');
const BadRequest = require('areto/error/BadRequestHttpException');
const NotFound = require('areto/error/NotFoundHttpException');
const OrderBehavior = require('areto/behavior/OrderBehavior');