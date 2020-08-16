/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('areto/base/Base');

module.exports = class MetaSecurity extends Base {

    constructor (config) {
        super(config);
        this.rbac = this.controller.module.getRbac();
        this.params = {controller: this.controller};
    }

    getForbiddenAttrs (action) {
        return this.attrAccess.forbiddenAttrMap[action];
    }

    mergeParams (params) {
        return params ? {...this.params, ...params} : this.params;
    }

    resolveAccess (data, params) {
        return this.rbac.resolveAccess(this.controller.user.assignments, data, this.mergeParams(params));
    }

    resolveAccessOnDelete (model) {
        return this.resolveAccess({
            targetType: Rbac.TARGET_OBJECT,
            target: model,
            actions: [Rbac.DELETE]
        });
    }

    resolveOnTitle (model) {
        return this.resolve({
            targetType: Rbac.TARGET_OBJECT,
            target: model,
            actions: [Rbac.READ]
        });
    }

    resolveOnIndex (data) {
        return this.resolve({
            targetType: Rbac.TARGET_NAV_NODE,
            target: data.node,
            targetClass: data.class,
            targetView: data.view,
            actions: [Rbac.READ, Rbac.CREATE, Rbac.UPDATE, Rbac.DELETE]
        });
    }

    resolveOnSort (view) {
        return this.resolve({
            targetType: Rbac.TARGET_VIEW,
            target: view,
            actions: [Rbac.UPDATE]
        });
    }

    async resolveOnList (view, params) {
        const actions = [Rbac.READ];
        const allowed = await this.resolve({
            targetType: Rbac.TARGET_VIEW,
            target: view,
            actions: params && params.actions || actions
        }, params);
        if (allowed) {
            await this.resolveAttrs({
                targetType: Rbac.TARGET_VIEW,
                target: view,
                actions
            }, params);
            await this.resolveRelations(view, params, actions);
        }
        return allowed;
    }

    async resolveOnRead (model, params) {
        await this.resolve({
            targetType: Rbac.TARGET_OBJECT,
            target: model,
            actions: [Rbac.READ]
        }, params);
        return this.resolveAttrs({
            targetType: Rbac.TARGET_OBJECT,
            target: model,
            actions: [Rbac.READ]
        }, params);
    }

    async resolveOnCreate (model, params) {
        await this.resolve({
            targetType: Rbac.TARGET_OBJECT,
            target: model,
            actions: [Rbac.CREATE]
        }, params);
        return this.resolveAttrs({
            targetType: Rbac.TARGET_OBJECT,
            target: model,
            actions: [Rbac.READ, Rbac.CREATE]
        }, params);
    }

    resolveOnUpdate (model, params) {
        return this.resolve({
            targetType: Rbac.TARGET_OBJECT,
            target: model,
            actions: [Rbac.READ, Rbac.UPDATE, Rbac.DELETE]
        }, params);
    }

    resolveAttrsOnUpdate (model) {
        return this.resolveAttrs({
            targetType: Rbac.TARGET_OBJECT,
            target: model,
            actions: [Rbac.READ, Rbac.UPDATE]
        });
    }

    resolveOnDelete (model, params) {
        return this.resolve({
            targetType: Rbac.TARGET_OBJECT,
            target: model,
            actions: [Rbac.DELETE]
        }, params);
    }

    resolveModelTransitions (model) {
        return this.resolveTransitions({
            targetType: Rbac.TARGET_OBJECT,
            target: model,
            actions: [Rbac.UPDATE]
        });
    }

    async resolve (data, params) {
        this.access = await this.resolveAccess(data, params);
        if (this.access.can(data.actions[0])) {
            return true;
        }
        if (!params || !params.skipAccessException) {
            throw new Forbidden('Access denied', `${data.targetType}: ${data.target}`);
        }
    }

    resolveTransitions (data, params) {
        params = this.mergeParams(params);
        return this.rbac.resolveTransitionAccess(this.controller.user.assignments, data, params);
    }

    async resolveAttrs (data, params) {
        params = this.mergeParams(params);
        this.attrAccess = await this.rbac.resolveAttrAccess(this.controller.user.assignments, data, params);
    }

    async resolveRelations (view, params, actions) {
        const data = {};
        const assignments = this.controller.user.assignments;
        params = this.mergeParams(params);
        this.relationAccessMap = {};
        for (const attr of view.relationAttrs) {
            data.target = attr.listView;
            data.targetType = data.target.isClass() ? Rbac.TARGET_CLASS : Rbac.TARGET_VIEW;
            data.actions = actions || this.controller.extraMeta.getAttrData(attr).actions;
            this.relationAccessMap[attr.name] = await this.rbac.resolveAccess(assignments, data, params);
        }
    }

    async resolveForbiddenReadAttrs (models, view) {
        if (this.attrAccess.hasAnyObjectTargetData(view.class.name)) {
            for (const model of models) {
                if (model.forbiddenReadAttrs === undefined) {
                    const data = await this.attrAccess.resolveObjectTarget(model);
                    model.forbiddenReadAttrs = data ? data[Rbac.READ] : null;
                }
            }
        }
    }

    getForbiddenReadAttrs () {
        return this.attrAccess.forbiddenAttrMap[Rbac.READ];
    }

    getForbiddenReadRelationMap (view) {
        const result = {};
        for (const {name} of view.relationAttrs) {
            result[name] = !this.relationAccessMap[name].canRead();
        }
        return result;
    }

    filterForbiddenAttrs (action, model) {
        const attrs = this.attrAccess.forbiddenAttrMap[action];
        if (Array.isArray(attrs)) {
            for (const attr of attrs) {
                model.unset(attr);
            }
        }
    }
};

const Forbidden = require('areto/error/http/Forbidden');
const Rbac = require('../security/rbac/Rbac');