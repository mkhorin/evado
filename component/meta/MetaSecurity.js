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
            targetType: Rbac.TARGET_NODE,
            target: data.node,
            targetClass: data.class,
            targetView: data.view,
            actions: [Rbac.READ, Rbac.CREATE, Rbac.DELETE]
        });
    }

    resolveOnSort (view) {
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
            actions: params && params.actions || [Rbac.READ]
        }, params);
    }

    resolveAttrsOnList (view, params) {
        return this.resolveAttrs({
            targetType: Rbac.TARGET_VIEW,
            target: view,
            actions: [Rbac.READ]
        }, params);
    }

    resolveOnRead (model, params) {
        return this.resolve({
            targetType: Rbac.TARGET_OBJECT,
            target: model,
            actions: [Rbac.READ]
        }, params);
    }

    resolveAttrsOnRead (model, params) {
        return this.resolveAttrs({
            targetType: Rbac.TARGET_OBJECT,
            target: model,
            actions: [Rbac.READ]
        }, params);
    }

    resolveOnCreate (model, params) {
        return this.resolve({
            targetType: Rbac.TARGET_OBJECT,
            target: model,
            actions: [Rbac.CREATE]
        }, params);
    }

    resolveAttrsOnCreate (model, params) {
        return this.resolveAttrs({
            targetType: Rbac.TARGET_OBJECT,
            target: model,
            actions: [Rbac.READ, Rbac.UPDATE]
        }, params);
    }

    resolveOnUpdate (model, params) {
        return this.resolve({
            targetType: Rbac.TARGET_OBJECT,
            target: model,
            actions: [Rbac.READ, Rbac.UPDATE, Rbac.DELETE]
        }, params);
    }

    resolveAttrsOnUpdate (model, params) {
        return this.resolveAttrs({
            targetType: Rbac.TARGET_OBJECT,
            target: model,
            actions: [Rbac.READ, Rbac.UPDATE]
        }, params);
    }

    resolveOnDelete (model, params) {
        return this.resolve({
            targetType: Rbac.TARGET_OBJECT,
            target: model,
            actions: [Rbac.DELETE]
        }, params);
    }

    resolveModelTransitions (model, readOnly) {
        return this.resolveTransitions({
            targetType: Rbac.TARGET_OBJECT,
            target: model,
            editableTarget: !readOnly
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

    async resolveRelations (view, params) {
        const data = {};
        const assignments = this.controller.user.assignments;
        params = this.mergeParams(params);
        this.relationAccessMap = {};
        for (const attr of view.relationAttrs) {
            data.target = attr.listView;
            data.targetType = data.target.isClass() ? Rbac.TARGET_CLASS : Rbac.TARGET_VIEW;
            data.actions = this.controller.extraMeta.getAttrData(attr).actions;
            this.relationAccessMap[attr.name] = await this.rbac.resolveAccess(assignments, data, params);
        }
    }

    async resolveForbiddenReadAttrs (models, view) {
        if (this.attrAccess && this.attrAccess.hasAnyObjectTargetData(view.class.name)) {
            for (const model of models) {
                if (model.forbiddenReadAttrs === undefined) {
                    const data = await this.attrAccess.resolveObjectTarget(model);
                    model.forbiddenReadAttrs = data?.[Rbac.READ];
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