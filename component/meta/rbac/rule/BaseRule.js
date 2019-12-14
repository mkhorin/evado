/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('areto/security/rbac/Rule');

module.exports = class BaseRule extends Base {

    isAllow () {
        return this.item.type === Rbac.ALLOW;
    }

    isDeny () {
        return this.item.type === Rbac.DENY;
    }

    isObjectTarget () {
        return this.inspector.targetType === Rbac.TARGET_OBJECT;
    }

    getTarget () {
        return this.inspector.target;
    }

    async execute () {
        return true; // can RBAC item be applied
    }
};

const Rbac = require('../../../security/rbac/Rbac');