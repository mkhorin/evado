'use strict';

const Base = require('areto/base/Action');

module.exports = class UtilAction extends Base {

    async execute () {
        let manager = this.module.get('util');
        if (this.isGet()) {
            return this.sendText(await manager.renderControls({
                controller: this.controller,
                renderParams: this.controller.getView().getRenderParams()
            }));
        }
        let postParams = this.getPostParams();
        let util = manager.getUtilConfig(postParams.id);
        if (!util) {
            throw new BadRequest('Invalid util');
        }
        util = manager.createUtil(util, {
            controller: this.controller,
            postParams
        });
        if (!util.isEnabled()) {
            throw new BadRequest('Disabled util');
        }
        return util.execute();
    }
};

const BadRequest = require('areto/error/BadRequestHttpException');