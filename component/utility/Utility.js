/**
 * @copyright Copyright (c) 2020 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('areto/base/Base');

module.exports = class Utility extends Base {

    static getBaseName () {
        if (!this._baseName) {
            this._baseName = StringHelper.camelToId(StringHelper.trimEnd(this.name, 'Utility'));
        }
        return this._baseName;
    }

    static getPermissionName () {
        if (!this._permissionName) {
            this._permissionName = 'utility' + StringHelper.trimEnd(this.name, 'Utility');
        }
        return this._permissionName;
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

    isUserId (id) {
        return this.controller.user.isId(id);
    }

    canAccess () {
        const name = this.getPermissionName();
        return this.controller.user.auth.rbac.getItem(name) ? this.controller.user.can(name) : true;
    }

    getBaseName () {
        return this.constructor.getName();
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

    getSpawnConfig (params) {
        return this.controller.getSpawnConfig(params);
    }

    getJson (data) {
        return {
            id: this.id,
            name: this.name,
            hint: this.hint,
            confirmation: this.confirmation,
            css: this.css,
            frontClass: this.frontClass,
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
        return this.renderExternal(`_utility/${this.getBaseName()}/${template}`);
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

    createNotification () {
        return this.module.getNotifier().createNotification(...arguments);
    }

    log () {
        CommonHelper.log(this.module, this.constructor.name, ...arguments);
    }
};

const StringHelper = require('areto/helper/StringHelper');