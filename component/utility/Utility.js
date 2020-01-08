/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('areto/base/Base');
const StringHelper = require('areto/helper/StringHelper');

module.exports = class Utility extends Base {

    static getConstants () {
        return {
            NAME: this.getName(),
            CONTROL_TEMPLATE: 'control'
        };
    }

    static getName () {
        const index = this.name.lastIndexOf('Utility');
        if (index === -1) {
            throw new Error(`Invalid utility class name: ${this.name}`);
        }
        return StringHelper.camelToId(this.name.substring(0, index));
    }

    isActive () {
        return this.enabled;
    }

    isIndexAction () {
        return this.sourceAction === 'index';
    }

    isCreateAction () {
        return this.sourceAction === 'create';
    }

    isUpdateAction () {
        return this.sourceAction === 'update';
    }

    isAction (...names) {
        for (const name of names) {
            if (this.sourceAction === name) {
                return true;
            }
        }
    }

    canAccess () {
        const permission = 'utility-'+ this.NAME;
        return this.controller.user.auth.rbac.getItem(permission)
            ? this.controller.user.can(permission)
            : true;
    }

    getHint () {
        return this.hint || this.name || this.id;
    }

    getTitle () {
        return this.name || this.id;
    }

    getUrl () {
        return this.manager.url;
    }

    execute () {
        this.controller.sendText('Utility completed');
    }

    render (template) {
        return this.renderExternal(`_utility/${this.NAME}/${template}`);
    }

    renderControl (data) {
        this.renderParams.data = {
            id: this.id,
            frontClass: this.frontClass,
            url: this.getUrl(),
            ...data
        };
        return this.renderExternal(`_utility/${this.CONTROL_TEMPLATE}`);
    }

    renderExternal (template) {
        this.renderParams.utility = this;
        const view = this.controller.getView();
        return view.renderTemplate(view.get(template), this.renderParams);
    }
};
module.exports.init();