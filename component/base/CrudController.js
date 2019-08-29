/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('./BaseController');

module.exports = class CrudController extends Base {

    static getConstants () {
        return {
            ACTIONS: {
                'sort-rel': require('../action/SortRelationAction'),
            },
            METHODS: {
                'select': 'GET',
                'remove': 'POST',
                'remove-list': 'POST',
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
/*
    async actionView (params) {
        params = {
            template: 'view',
            ...params
        };
        return this.render(params.template, {
            model: await this.getModel(params),
            _layout: this.isAjax() ? '_layout/modal/model-view' : '_layout/empty',
            ...params.templateData
        });
    }
*/
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
        if (this.isGet()) {
            await model.setDefaultValues();
            const _layout = this.getViewLayout();
            return this.render(params.template, {model, _layout, ...params.templateData});
        }
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
            model.load(this.getPostParams());
            if (params.beforeUpdate) {
                await params.beforeUpdate.call(this, model);
            }
            if (params.beforePostUpdate) {
                await params.beforePostUpdate.call(this, model);
            }
            return this.saveModel(model, this.afterUpdate);
        }
        let data = {};
        if (params.beforeUpdate) {
            await params.beforeUpdate.call(this, model);
        }
        if (params.beforeGetUpdate) {
            data = params.beforeGetUpdate.call(this, model);
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

    // REMOVE

    async actionRemove () {
        const model = await this.getModel();
        await model.remove();
        this.sendText(model.getId());
    }

    async actionRemoveList () {
        const ids = this.getPostParam('ids');
        if (!ids) {
            throw new BadRequest;
        }
        const Class = this.getModelClass();
        const models = await this.spawn(Class).findById(ids.split(',')).all();
        await Class.remove(models);
        this.sendStatus(200);
    }

    // LIST

    actionList (query, params) {
        query = query || this.createModel().find();
        return this.sendDataGridList(query, {
            formatRules: [[['createdAt', 'updatedAt'], 'timestamp']],
            viewModel: 'list',
            ...params
        });
    }

    actionListSelect (params) {
        return this.sendSelectList(this.createModel().find(), params);
    }

    async actionListRel (params) {
        params = {
            pid: this.getQueryParam('pid'),
            rel: this.getQueryParam('rel'),
            viewModel: this.getQueryParam('rel'),
            formatRules: [[['createdAt', 'updatedAt'], 'timestamp']],
            with: null,
            ...params
        };
        let rel = null;
        if (params.pid) {
            const model = await this.getModel({id: params.pid});
            rel = model.getRelation(params.rel).with(params.with);
        } else { // new model            
            rel = this.createModel().getRelation(params.rel).model.find(['FALSE']);
        }
        if (!rel) {
            throw new NotFound;
        }
        return this.sendDataGridList(rel, params);
    }

    actionListRelSelect (params) {
        params = {
            pid: this.getQueryParam('pid'),
            rel: this.getQueryParam('rel'),
            ...params
        };
        const model = this.createModel();
        const rel = model.getRelation(params.rel).with(params.with);
        if (rel) {
            return this.sendSelectList(rel.model.find(), params);
        }
        throw new NotFound;
    }

    // METHOD

    getViewLayout () {
        return this.isAjax()
            ? '_layout/modal/model-form'
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

const BadRequest = require('areto/error/BadRequestHttpException');
const NotFound = require('areto/error/NotFoundHttpException');