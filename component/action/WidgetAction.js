/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('areto/base/Action');

module.exports = class WidgetAction extends Base {

    async execute () {
        const view = this.controller.createView();
        const widget = view.createWidget(this.getQueryParam('id'));
        if (!widget) {
            throw new BadRequest('Widget not found');
        }
        this.sendText(await widget.execute(view.getRenderParams()));
    }
};

const BadRequest = require('areto/error/BadRequestHttpException');