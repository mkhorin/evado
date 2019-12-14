/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('./BaseRule');

module.exports = class AuthorRule extends Base {

    async execute () {
        if (this.isObjectTarget()) {
            const isAuthor = this.isEqual(this.getTarget().get('_creator'), this.getUser().getId());
            return this.isAllow() ? isAuthor : !isAuthor;
        }
        return this.isAllow(); // pass rule: need to allow - true, need to deny - false
    }

    async getObjectFilter () {
        return {_creator: this.getUser().getId()};
    }
};