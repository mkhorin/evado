/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('areto/security/rbac/Rule');

module.exports = class BaseRule extends Base {

    isAllowType () {
        return this.item.type === Rbac.ALLOW;
    }

    isDenyType () {
        return this.item.type === Rbac.DENY;
    }

    isObjectTarget () {
        return this.inspector.targetType === Rbac.TARGET_OBJECT;
    }

    getBaseMeta () {
        return this.params.controller.module.getBaseMeta();
    }

    getTarget () {
        return this.inspector.target;
    }

    getPostData () {
        return this.params.controller.getPostParam('data');
    }

    async execute () {
        return true; // can RBAC item be applied
    }
};

const Rbac = require('../../../security/rbac/Rbac');