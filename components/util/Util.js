'use strict';

const Base = require('areto/base/Base');
const StringHelper = require('areto/helper/StringHelper');

module.exports = class Util extends Base {

    static getConstants () {
        return {
            NAME: this.getName()
        };
    }

    static getName () {
        return StringHelper.camelToId(this.name);
    }

    renderTool () {
        this.renderParams.util = this;        
        return this.controller.getView().renderTemplate(this.getTemplate('tool'), this.renderParams);
    }

    getTemplate (name) {
        return this.controller.getView().get(`_util/${this.NAME}/${name}`);
    }

    getUrl () {
        return `${this.manager.url}?id=${this.name}&project=${this.project}`;
    }

    run (controller, data) {
        this.controller = controller;
        this.module = controller.module;
        this.data = data;
        this.execute();
    }

    execute () {
        this.controller.sendText('ok');
    }

    isIndexAction () {
        return this.controller.action.name === 'index';
    }

    isCreateAction () {
        return this.controller.action.name === 'create';
    }

    isUpdateAction () {
        return this.controller.action.name === 'update';
    }

    isAction () {
        for (let name of arguments) {
            if (this.controller.action.name === name) {
                return true;
            }
        }
    }
};
module.exports.init();

const PromiseHelper = require('areto/helper/PromiseHelper');