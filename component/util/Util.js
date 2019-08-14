/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
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
        const index = this.name.lastIndexOf('Util');
        if (index === -1) {
            throw new Error(this.wrapClassMessage(`Invalid utility class name: ${this.name}`));
        }
        return StringHelper.camelToId(this.name.substring(0, index));
    }

    constructor (config) {
        super({
            controlTemplate: 'control',
            ...config
        })
    }

    isEnabled () {
        return true;
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

    isAction (...names) {
        for (const name of names) {
            if (this.controller.action.name === name) {
                return true;
            }
        }
    }

    getTemplate (name) {
        return this.controller.getView().get(`_util/${this.NAME}/${name}`);
    }

    getUrl () {
        return this.manager.url;
    }

    execute () {
        this.controller.sendText('Utility completed');
    }

    renderControl () {
        return this.render(this.controlTemplate, this.renderParams);
    }

    render (template, params = {}) {
        params.util = this;
        return this.controller.getView().renderTemplate(this.getTemplate(template), params);
    }
};
module.exports.init();