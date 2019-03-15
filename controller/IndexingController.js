'use strict';

const Base = require('../component/BaseController');

module.exports = class IndexingController extends Base {

    static getConstants() {
        return {
            METHODS: {
                'create': ['POST'],
                'drop': ['POST'],
                'rebuild': ['POST']
            }
        };
    }

    async actionView () {
        let id = this.getQueryParam('id');
        let model = this.getModel();
        try {
            let indexes = await model.getDb().getIndexes(model.TABLE);
            return this.render('view', {id, model, indexes});
        } catch (err) {
            if (err && err.message === 'no collection') {
                return this.render('error', {id, model});
            }
            throw err;
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

    getModel (cb) {
        let ModelClass;
        try {
            ModelClass = require(this.module.app.getPath(this.getQueryParam('id')));
        } catch (err) {
            throw new NotFound;
        }
        if (!(ModelClass.prototype instanceof ActiveRecord)) {
            throw new BadRequest('Target is not ActiveRecord');
        }
        return new ModelClass;
    }

    getValidParams () {
        let params = CommonHelper.parseJson(getPostParam('params'));
        return params instanceof Array && params[0] && typeof params[0] === 'object'
            ? params : null;
    }
};
module.exports.init(module);

const CommonHelper = require('areto/helper/CommonHelper');
const BadRequest = require('areto/error/BadRequestHttpException');
const NotFound = require('areto/error/NotFoundHttpException');
const ActiveRecord = require('areto/db/ActiveRecord');