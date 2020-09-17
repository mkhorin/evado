/**
 * @copyright Copyright (c) 2020 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('./BaseController');

module.exports = class CrudController extends Base {

    static getConstants () {
        return {
            ACTIONS: {
                'sort-related': {
                    Class: require('../action/SortRelatedAction')
                }
            },
            METHODS: {
                'select': 'GET',
                'delete': 'POST',
                'delete-list': 'POST',
                'export': 'POST'
            }
        };
    }

    actionIndex (params) {
        params = {
            model: this.createModel(),
            template: 'index',
            ...params
        };
        return this.render(params.template, {
            model: params.model,
            params: this.getQueryParams(),
            ...params.templateData
        });
    }

    actionSelect (params) {
        params = {
            model: this.createModel(),
            template: 'select',
            ...params
        };
        return this.render(params.template, {
            model: params.model,
            params: this.getQueryParams(),
            ...params.templateData   
        });
    }

    async actionViewTitle (params) {
        const model = await this.getModel(params);
        this.sendJson(model.getTitle());
    }

    async actionCreate (params) {
        params = {
            scenario: 'create',
            template: 'create',
            afterCreate: this.afterCreate,
            ...params
        };
        const model = params.model || this.createModel();
        model.scenario = params.scenario;
        await model.setDefaultValues();
        if (this.isGet()) {
            const _layout = this.getViewLayout();
            return this.render(params.template, {model, _layout, ...params.templateData});
        }
        this.checkCsrfToken();
        model.load(this.getPostParams());
        return this.saveModel(model, params.afterCreate);
    }

    async actionUpdate (params) {
        params = {
            scenario: 'update',
            template: 'update',
            ...params
        };
        const model = await this.getModel(params);
        model.scenario = params.scenario;
        model.user = this.user;
        if (params.getParamsByModel) {
            Object.assign(params, params.getParamsByModel(model));
        }
        if (this.isPost()) {
            this.checkCsrfToken();
            model.load(this.getPostParams());
            if (params.beforeUpdate) {
                await params.beforeUpdate.call(this, model);
            }
            return this.saveModel(model, this.afterUpdate);
        }
        let data = {};
        if (params.beforeUpdate) {
            await params.beforeUpdate.call(this, model);
        }
        const _layout = this.getViewLayout();
        Object.assign(data, {model, _layout}, params.templateData);
        await this.render(params.template, data);
    }

    async actionClone (params) {
        params = {
            model: this.createModel(),
            scenario: 'clone',
            ...params
        };
        const sample = await this.getModelByClassName({className: this.getQueryParam('sampleClass')});
        params.model.getBehavior('clone').setOriginal(sample);
        return this.actionCreate(params);
    }

    actionFilter (params) {
        params = {
            model: this.createModel(),
            template: 'filter',
            ...params
        };
        return this.render(params.template, {
            model: params.model,
            params: this.getQueryParams(),
            ...params.templateData
        });
    }

    // DELETE

    async actionDelete () {
        this.checkCsrfToken();
        const model = await this.getModel();
        await model.delete();
        this.sendText(model.getId());
    }

    async actionDeleteList () {
        const ids = this.getPostParam('ids');
        if (!ids) {
            throw new BadRequest;
        }
        this.checkCsrfToken();
        const Class = this.getModelClass();
        const models = await this.spawn(Class).findById(ids.split(',')).all();
        await Class.delete(models);
        this.sendStatus(200);
    }

    // LIST

    actionList (query, params) {
        query = query || this.createModel().createQuery();
        return this.sendGridList(query, {
            viewModel: 'list',
            ...params
        });
    }

    actionListSelect (params) {
        return this.sendSelectList(this.createModel().createQuery(), params);
    }

    async actionListRelated (params) {
        const relation = this.getQueryParam('rel');
        params = {
            pid: this.getQueryParam('pid'),
            relation: relation,
            viewModel: relation,
            with: this.getListRelatedWith(relation),
            ...params
        };
        const model = params.pid
            ? await this.getModel({id: params.pid})
            : this.createModel();
        const query = model.getRelation(relation);
        if (!query) {
            throw new BadRequest('Relation not found');
        }
        params.pid ? query.with(params.with) : query.where(['FALSE']);
        return this.sendGridList(query, params);
    }

    actionListRelatedSelect (params) {
        params = {
            pid: this.getQueryParam('pid'),
            relation: this.getQueryParam('rel'),
            ...params
        };
        const query = this.createModel().getRelation(params.relation);
        if (!query) {
            throw new BadRequest('Relation not found');
        }
        return this.sendSelectList(query.with(params.with), params);
    }

    // METHOD

    getListRelatedWith () {
        return null;
    }

    getViewLayout () {
        return this.isAjax()
            ? '_layout/modal/modelForm'
            : '_layout/empty';
    }

    async saveModel (model, afterSave) {
        if (!await model.save()) {
            return this.handleModelError(model);
        }
        if (afterSave) {
            await afterSave.call(this, model);
        }
        this.sendText(model.getId());
    }
};
module.exports.init();

const BadRequest = require('areto/error/http/BadRequest');