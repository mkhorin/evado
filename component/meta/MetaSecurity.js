/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('areto/base/Base');

module.exports = class MetaSecurity extends Base {

    constructor (config) {
        super(config);
        this.rbac = this.controller.module.get('rbac');
    }

    getForbiddenAttrs (action) {
        return this.attrAccess.forbiddenAttrMap[action];
    }

    getAccess (data, params) {
        return this.rbac.getAccess(this.controller.user.assignments, data, params);
    }

    getAccessOnDelete (model) {
        return this.getAccess({
            targetType: Rbac.TARGET_OBJECT,
            target: model,
            actions: [Rbac.DELETE]
        });
    }

    resolveOnIndex (metaData) {
        return this.resolve({
            targetType: Rbac.TARGET_NAV_NODE,
            target: metaData.node,
            targetClass: metaData.class,
            targetView: metaData.view,
            actions: [Rbac.READ, Rbac.CREATE, Rbac.UPDATE, Rbac.DELETE]
        });
    }

    resolveOnOrder (view) {
        return this.resolve({
            targetType: Rbac.TARGET_VIEW,
            target: view,
            actions: [Rbac.UPDATE]
        });
    }

    resolveOnList (view, params) {
        return this.resolve({
            targetType: Rbac.TARGET_VIEW,
            target: view,
            actions: [Rbac.READ],
            ...params
        });
    }

    resolveOnTitle (model) {
        return this.resolve({
            targetType: Rbac.TARGET_OBJECT,
            target: model,
            actions: [Rbac.READ]
        });
    }

    async resolveOnCreate (view) {
        await this.resolve({
            targetType: Rbac.TARGET_VIEW,
            target: view,
            actions: [Rbac.CREATE]
        });
        await this.resolveAttrs({
            targetType: Rbac.TARGET_VIEW,
            target: view,
            actions: [Rbac.READ, Rbac.CREATE]
        });
    }

    async resolveOnUpdate (model) {
        await this.resolve({
            targetType: Rbac.TARGET_OBJECT,
            target: model,
            actions: [Rbac.READ, Rbac.UPDATE, Rbac.DELETE]
        });
        await this.resolveAttrs({
            targetType: Rbac.TARGET_OBJECT,
            target: model,
            actions: [Rbac.READ, Rbac.UPDATE]
        });
    }

    resolveModelTransitions (model) {
        return this.resolveTransitions({
            targetType: Rbac.TARGET_OBJECT,
            target: model,
            actions: [Rbac.UPDATE]
        });
    }

    async resolve (data, params) {
        this.access = await this.getAccess(data);
        this.noAccessMessage = this.controller.format(null, 'noAccess');
        if (!this.access.can(data.actions[0])) {
            throw new Forbidden;
        }
    }

    resolveTransitions (data, params) {
        return this.rbac.getTransitionAccess(this.controller.user.assignments, data, params);
    }

    async resolveAttrs (data, params) {
        this.attrAccess = await this.rbac.getAttrAccess(this.controller.user.assignments, data, params);
    }

    async resolveRelations (view) {
        let data = {
            targetType: Rbac.TARGET_CLASS,
            actions: [Rbac.CREATE, Rbac.UPDATE, Rbac.DELETE]
        };
        this.relAccess = {};
        for (let attr of view.relationAttrs) {
            data.target = attr.rel.refClass;
            this.relAccess[attr.name] = await this.rbac.getAccess(this.controller.user.assignments, data, null);
        }
    }

    async resolveListForbiddenAttrs (models, view) {
        await this.resolveAttrs({
            targetType: Rbac.TARGET_VIEW,
            target: view,
            actions: [Rbac.READ]
        });
        if (!this.attrAccess.hasAnyObjectTargetData(view.class.name)) {
            return false;
        }
        for (let model of models) {
            let data = await this.attrAccess.resolveObjectTarget(model);
            model.readForbiddenAttrs = data && data[Rbac.READ];
        }
    }

    filterForbiddenAttrs (action, model) {
        let attrs = this.attrAccess.forbiddenAttrMap[action];
        if (Array.isArray(attrs)) {
            for (let attr of attrs) {
                model.unset(attr);
            }
        }
    }
};

const Forbidden = require('areto/error/ForbiddenHttpException');
const Rbac = require('../rbac/Rbac');