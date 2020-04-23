/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('areto/base/Base');

module.exports = class MetaSecurity extends Base {

    constructor (config) {
        super(config);
        this.rbac = this.controller.module.getRbac();
        this.params = {
            controller: this.controller,
            user: this.controller.user
        };
    }

    getForbiddenAttrs (action) {
        return this.attrAccess.forbiddenAttrMap[action];
    }

    resolveAccess (data, params) {
        params = params ? this.params : {...this.params, ...params};
        return this.rbac.resolveAccess(this.controller.user.assignments, data, params);
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
            actions,
            ...params
        });
        if (allowed) {
            await this.resolveAttrs({
                targetType: Rbac.TARGET_VIEW,
                target: view,
                actions
            });
            await this.resolveRelations(view, actions);
        }
        return allowed;
    }

    async resolveOnRead (model) {
        await this.resolve({
            targetType: Rbac.TARGET_OBJECT,
            target: model,
            actions: [Rbac.READ]
        });
        return this.resolveAttrs({
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
        return this.resolveAttrs({
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
        return this.resolveAttrs({
            targetType: Rbac.TARGET_OBJECT,
            target: model,
            actions: [Rbac.READ, Rbac.UPDATE]
        });
    }

    resolveOnDelete (model) {
        return this.resolve({
            targetType: Rbac.TARGET_OBJECT,
            target: model,
            actions: [Rbac.DELETE]
        });
    }

    resolveModelTransitions (model) {
        return this.resolveTransitions({
            targetType: Rbac.TARGET_OBJECT,
            target: model,
            actions: [Rbac.UPDATE]
        });
    }

    async resolve (data) {
        this.access = await this.resolveAccess(data);
        if (this.access.can(data.actions[0])) {
            return true;
        }
        if (!data.skipAccessException) {
            throw new Forbidden('Access denied', `${data.targetType}: ${data.target}`);
        }
    }

    resolveTransitions (data, params) {
        return this.rbac.resolveTransitionAccess(this.controller.user.assignments, data, params);
    }

    async resolveAttrs (data, params) {
        this.attrAccess = await this.rbac.resolveAttrAccess(this.controller.user.assignments, data, params);
    }

    async resolveRelations (view, actions = [Rbac.READ, Rbac.CREATE, Rbac.UPDATE, Rbac.DELETE]) {
        const data = {
            targetType: Rbac.TARGET_CLASS,
            actions
        };
        const assignments = this.controller.user.assignments;
        this.relationAccessMap = {};
        for (const attr of view.relationAttrs) {
            data.target = attr.relation.refClass;
            this.relationAccessMap[attr.name] = await this.rbac.resolveAccess(assignments, data, null);
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

const Forbidden = require('areto/error/ForbiddenHttpException');
const Rbac = require('../security/rbac/Rbac');