'use strict';

const Base = require('areto/base/Action');

module.exports = class WidgetAction extends Base {

    async execute () {
        let widget = this.controller.createView().createWidget(this.getQueryParam('id'));
        if (!widget) {
            throw new NotFound;
        }
        this.sendText(await widget.execute());
    }
};

const NotFound = require('areto/error/NotFoundHttpException');