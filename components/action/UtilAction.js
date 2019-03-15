'use strict';

const Base = require('areto/base/Action');

module.exports = class UtilAction extends Base {

    execute () {
        let module = this.controller.module;
        let meta = module.get('meta');
        if (!meta) {
            throw new Error('Not set meta manager');
        }
        let util = module.get('util');
        if (!util) {
            throw new BadRequest('Not set util manager');
        }
        let params = this.getQueryParams();
        let project = meta.projects.get(params.project);
        let item = util.createUtil(params.id, project);
        if (!item) {
            throw new NotFound('Not found util');
        }
        return item.execute(this.controller, this.getPostParams());
    }
};

const BadRequest = require('areto/error/BadRequestHttpException');
const NotFound = require('areto/error/NotFoundHttpException');