/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('areto/base/Action');

module.exports = class WidgetAction extends Base {

    async execute () {
        const view = this.controller.createView();
        const {id} = this.getQueryParams();
        const widget = view.createWidget(id);
        if (!widget) {
            throw new BadRequest('Widget not found');
        }
        widget.widgetAction = this;
        const params = view.getRenderParams();
        const content = await widget.resolveContent(params);
        this.send(content);
    }
};

const BadRequest = require('areto/error/http/BadRequest');