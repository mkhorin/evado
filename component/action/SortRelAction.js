/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('areto/base/Action');

module.exports = class SortRelAction extends Base {

    async execute () {
        const {pid, rel} = this.getQueryParams();
        await this.setParentModel(pid);
        await this.setRelation(rel);
        if (this.isGet()) {
            return this.renderOrder();
        }
        await this.updateOrder(this.getPostParam('order'));
        await this.send('Done');
    }

    async setParentModel (id) {
        this.parentModel = await this.controller.getModel({id});
        if (!this.parentModel) {
            throw new BadRequest('Model not found');
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
        const data = {
            'parentModel': this.parentModel,
            'relModel': this.relation.model,
            'models': await this.relation.order({[this.orderBehavior.orderAttr]: 1}).all(),
            'orderAttr': this.orderBehavior.orderAttr
        };
        data.relController = data.relModel.createController().assignSource(this.controller);
        let viewModel = data.relController.createViewModel('sort', {data}), content;
        if (viewModel) {
            await viewModel.prepareModels(data.models);
            content = await data.relController.renderViewModel(viewModel, 'sort', false);
        } else {
            content = await data.relController.renderTemplate('sort', data, false);
        }
        return this.send(content);
    }
};

const BadRequest = require('areto/error/BadRequestHttpException');
const OrderBehavior = require('areto/behavior/OrderBehavior');