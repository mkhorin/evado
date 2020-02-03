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
        return this.modelAction === 'index';
    }

    isCreateAction () {
        return this.modelAction === 'create';
    }

    isUpdateAction () {
        return this.modelAction === 'update';
    }

    isAction (...names) {
        for (const name of names) {
            if (this.modelAction === name) {
                return true;
            }
        }
    }

    canAccess () {
        const name = this.getPermissionName();
        return this.controller.user.auth.rbac.getItem(name) ? this.controller.user.can(name) : true;
    }

    getPermissionName () {
        return 'utility' + this.NAME;
    }

    getControlTemplate () {
        return this.CONTROL_TEMPLATE;
    }

    getHint () {
        return this.hint || this.name || this.id;
    }

    getTitle () {
        return this.name || this.id;
    }

    getJson (data) {
        return {
            id: this.id,
            name: this.name,
            hint: this.hint,
            frontClass: this.frontClass,
            ...data
        };
    }

    execute () {
        this.controller.sendText('Utility completed');
    }

    render (template) {
        return this.renderExternal(`_utility/${this.NAME}/${template}`);
    }

    renderControl (data) {
        this.renderParams.data = this.getJson(data);
        return this.renderExternal(`_utility/${this.getControlTemplate()}`);
    }

    renderExternal (template) {
        this.renderParams.utility = this;
        const view = this.controller.getView();
        return view.renderTemplate(view.get(template), this.renderParams);
    }
};
module.exports.init();