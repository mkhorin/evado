/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('areto/base/Action');

module.exports = class UtilityAction extends Base {

    async execute () {
        const postParams = this.getPostParams();
        if (!postParams.id) {
            return this.renderControls();
        }
        const manager = this.module.get('utility');
        const config = manager.getUtilityConfig(postParams.id);
        if (!config) {
            throw new BadRequest('Utility not found');
        }
        const utility = manager.createUtility(config, {
            controller: this.controller,
            sourceAction: postParams.action,
            postParams
        });
        if (!await utility.isActive()) {
            throw new BadRequest('Utility disabled');
        }
        if (!await utility.canAccess()) {
            throw new Forbidden;
        }
        return utility.execute();
    }

    async renderControls () {
        const manager = this.module.get('utility');
        this.sendText(await manager.renderControls({
            controller: this.controller,
            sourceAction: this.getPostParam('action'),
            postParams: this.getPostParams(),
            renderParams: this.controller.getView().getRenderParams()
        }));
    }
};

const BadRequest = require('areto/error/BadRequestHttpException');
const Forbidden = require('areto/error/ForbiddenHttpException');