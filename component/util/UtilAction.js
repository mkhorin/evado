/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('areto/base/Action');

module.exports = class UtilAction extends Base {

    async execute () {
        const manager = this.module.get('util');
        if (this.isGet()) {
            return this.sendText(await manager.renderControls({
                controller: this.controller,
                renderParams: this.controller.getView().getRenderParams()
            }));
        }
        const postParams = this.getPostParams();
        const config = manager.getUtilConfig(postParams.id);
        if (!config) {
            throw new BadRequest('Invalid utility');
        }
        const util = manager.createUtil(util, {
            controller: this.controller,
            postParams
        });
        if (!util.isEnabled()) {
            throw new BadRequest('Disabled utility');
        }
        return util.execute();
    }
};

const BadRequest = require('areto/error/BadRequestHttpException');