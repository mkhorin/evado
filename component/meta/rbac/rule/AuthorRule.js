/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('./BaseRule');

module.exports = class AuthorRule extends Base {

    execute () {
        return this.isObjectTarget() // list targets filter by getObjectFilter
            ? this.checkAuthor()
            : this.isAllowType(); // pass rule: need to allow - true, need to deny - false
    }

    checkAuthor () {
        const matched = this.isEqual(this.getTarget().get('_creator'), this.getUser().getId());
        return this.isAllowType() ? matched : !matched;
    }

    getObjectFilter () {
        return {_creator: this.getUser().getId()};
    }
};