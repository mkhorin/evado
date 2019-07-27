/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('../component/base/BaseController');

module.exports = class IndexingController extends Base {

    static getConstants () {
        return {
            BEHAVIORS: {
                'access': {
                    Class: require('areto/filter/AccessControl'),
                    rules: [{
                        actions: ['create', 'drop', 'rebuild'],
                        permissions: ['indexing']
                    }]
                }
            },
            METHODS: {
                'create': 'post',
                'drop': 'post',
                'rebuild': 'post'
            }
        };
    }

    async actionView () {
        let id = this.getQueryParam('id');
        let model = this.getModel();
        let indexes = null;
        try {
            indexes = await model.getDb().getIndexes(model.TABLE);
            this.render('view', {id, model, indexes});
        } catch (err) {
            this.render('error', {id, model});
        }
    }

    async actionCreate () {
        let model = this.getModel();
        let params = this.getValidParams();
        if (!params) {
            throw new BadRequest('Invalid params');
        }
        await model.getDb().createIndex(model.TABLE, params);
        this.sendJson(await model.getDb().getIndexes(model.TABLE));
    }

    async actionDrop () {
        let model = this.getModel();
        let params = this.getValidParams();
        if (!params || !params[1]) {
            throw new BadRequest('Invalid params');
        }
        await model.getDb().dropIndex(model.TABLE, params[1].name);
        this.sendStatus(200);
    }

    async actionRebuild () {
        let model = this.getModel();
        await model.getDb().reIndex(model.TABLE);
        this.sendStatus(200);
    }

    getModel () {
        let Class = this.getQueryParam('id');
        try {
            Class = this.module.require(Class) || require(Class);
        } catch (err) {
            throw new BadRequest(`File not found: ${Class}`);
        }
        if (!(Class.prototype instanceof ActiveRecord)) {
            throw new BadRequest('Class not extends ActiveRecord');
        }
        return this.spawn(Class);
    }

    getValidParams () {
        let params = CommonHelper.parseJson(getPostParam('params'));
        return Array.isArray(params) && params[0] && typeof params[0] === 'object' ? params : null;
    }
};
module.exports.init(module);

const CommonHelper = require('areto/helper/CommonHelper');
const BadRequest = require('areto/error/BadRequestHttpException');
const ActiveRecord = require('areto/db/ActiveRecord');