/**
 * @copyright Copyright (c) 2020 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('areto/base/Base');

module.exports = class Utility extends Base {

    static getRouteName () {
        if (!this._routeName) {            
            this._routeName = StringHelper.camelToKebab(this.getName());
        }
        return this._routeName;
    }

    static getPermissionName () {
        if (!this._permissionName) {
            this._permissionName = 'utility' + this.getName();
        }
        return this._permissionName;
    }
    
    static getName () {
        return StringHelper.trimEnd(this.name, 'Utility');
    } 

    /**
     * Check utility availability
     * @returns {boolean}
     */
    isActive () {
        if (!this.enabled) {
            return false;
        }
        return !this.actions
            || !this.modelAction
            || this.actions.includes(this.modelAction);
    }

    isIndexAction () {
        return this.modelAction === 'index' || !this.modelAction;
    }

    isCreateAction () {
        return this.modelAction === 'create' || !this.modelAction;
    }

    isUpdateAction () {
        return this.modelAction === 'update' || !this.modelAction;
    }

    isUserId (id) {
        return this.controller.user.isId(id);
    }

    canAccess () {
        const name = this.getPermissionName();
        return this.controller.user.auth.rbac.getItem(name)
            ? this.controller.user.can(name)
            : true;
    }

    getRouteName () {
        return this.constructor.getRouteName();
    }

    getPermissionName () {
        return this.constructor.getPermissionName();
    }

    getControlTemplate () {
        return 'control';
    }

    getHint () {
        return this.hint || this.name || this.id;
    }

    getTitle () {
        return this.name || this.id;
    }

    getSpawnConfig () {
        return this.controller.getSpawnConfig(...arguments);
    }

    getJson (data) {
        return {
            id: this.id,
            name: this.name,
            hint: this.hint,
            confirmation: this.confirmation,
            css: this.css,
            clientClass: this.clientClass,
            ...data
        };
    }

    getUserId () {
        return this.controller.user.getId();
    }

    execute () {
        this.controller.sendText('Utility completed');
    }

    render (template) {
        return this.renderExternal(`_utility/${this.getRouteName()}/${template}`);
    }

    renderControl (data) {
        this.renderParams.data = this.getJson(data);
        return this.renderExternal(`_utility/${this.getControlTemplate()}`);
    }

    renderExternal (template) {
        this.renderParams.utility = this;
        const view = this.controller.getView();
        const name = view.get(template);
        return view.renderTemplate(name, this.renderParams);
    }

    log () {
        CommonHelper.log(this.module, this.constructor.name, ...arguments);
    }
};

const CommonHelper = require('areto/helper/CommonHelper');
const StringHelper = require('areto/helper/StringHelper');