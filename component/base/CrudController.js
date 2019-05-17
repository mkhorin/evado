'use strict';

const Base = require('./BaseController');

module.exports = class CrudController extends Base {

    static getConstants () {
        return {
            ACTIONS: {
                'sort-rel': require('evado/component/action/SortRelAction'),
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

    async actionView (params) {
        params = {
            template: 'view',
            ...params
        };
        return this.render(params.template, {
            model: await this.getModel(params),
            viewLayout: this.isAjax() ? '_layout/modal/model-view' : '_layout/empty',
            ...params.templateData
        });
    }

    async actionViewTitle (params) {
        let model = await this.getModel(params);
        this.sendJson(model.getTitle());
    }

    async actionCreate (params) {
        params = {
            scenario: 'create',
            template: 'create',
            afterCreate: this.afterCreate,
            ...params
        };
        let model = params.model || this.createModel();
        model.scenario = params.scenario;
        await model.setDefaultValues();
        if (this.isGet()) {
            let viewLayout = this.getViewLayout();
            return this.render(params.template, {model, viewLayout, ...params.templateData});
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
        let model = await this.getModel(params);
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
        let viewLayout = this.getViewLayout();
        Object.assign(data, {model, viewLayout}, params.templateData);
        return this.render(params.template, data);
    }

    async actionClone (params) {
        params = {
            model: this.createModel(),
            scenario: 'clone',
            ...params
        };
        let sample = await this.getModelByClassName({
            className: this.getQueryParam('sampleClass')
        });
        params.model.getBehavior('clone').setSample(sample);
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
        let model = await this.getModel({id: this.getPostParam('id')});
        await model.remove();
        this.sendText(model.getId());
    }

    async actionRemoveList () {
        let ids = this.getPostParam('ids');
        if (!ids) {
            throw new BadRequest;
        }
        let ModelClass = this.getModelClass();
        let models = await this.spawn(ModelClass).findById(ids.split(',')).all();
        await ModelClass.removeBatch(models);
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
        params = {
            searchAttrs: ['name', 'label'],
            ...params
        };
        return this.sendSelectList(this.createModel().find(), params)
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
            let model = await this.getModel({id: params.pid});
            rel = model.getRelation(params.rel).with(params.with);
        } else { // new model
            let model = this.createModel();
            rel = model.getRelation(params.rel).model.find(['FALSE']);
        }
        if (!rel) {
            throw new NotFound;
        }
        return this.sendDataGridList(rel, params);
    }

    actionListRelSelect (params) {
        params = {
            searchAttrs: ['name'],
            pid: this.getQueryParam('pid'),
            rel: this.getQueryParam('rel'),
            ...params
        };
        let model = this.createModel();
        let rel = model.getRelation(params.rel).with(params.with);
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

    async sendListSelect (query, labelName = 'name') {
        let items = await query.all();
        this.sendJson(items.map(item => ({
            value: item.getId(),
            text: item.get(labelName)
        })));
    }
};

const BadRequest = require('areto/error/BadRequestHttpException');
const NotFound = require('areto/error/NotFoundHttpException');