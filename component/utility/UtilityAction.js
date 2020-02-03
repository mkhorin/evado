/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('areto/base/Action');

module.exports = class UtilityAction extends Base {

    async execute () {
        this.manager = this.module.get('utility');
        this.postParams = this.getPostParams();
        if (!this.postParams.id) {
            return this.sendList();
        }
        const config = this.manager.getUtilityConfig(this.postParams.id);
        if (!config) {
            throw new BadRequest('Utility not found');
        }
        const utility = this.manager.createUtility(config, {
            controller: this.controller,
            modelAction: this.postParams.action,
            postParams: this.postParams
        });
        if (!await utility.isActive()) {
            throw new BadRequest('Utility disabled');
        }
        if (!await utility.canAccess()) {
            throw new Forbidden;
        }
        return utility.execute();
    }

    async sendList () {
        const utilities = await this.manager.createUtilities({
            controller: this.controller,
            modelAction: this.postParams.action,
            renderParams: this.controller.getView().getRenderParams(),
            postParams: this.postParams
        });
        return this.renderedControl
            ? this.sendRenderList(utilities)
            : this.sendJsonList(utilities);
    }

    async sendJsonList (utilities) {
        const result = [];
        for (const utility of utilities) {
            result.push(await utility.getJson());
        }
        return this.sendJson(result);
    }

    async sendRenderList (utilities) {
        let result = '';
        for (const utility of utilities) {
            result += await utility.renderControl();
        }
        return this.sendText(result);
    }
};

const BadRequest = require('areto/error/BadRequestHttpException');
const Forbidden = require('areto/error/ForbiddenHttpException');