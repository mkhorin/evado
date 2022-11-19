/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('areto/base/Behavior');

module.exports = class UnsetChangedAttrBehavior extends Base {

    constructor (config) {
        super({
            attr: 'owner',
            ...config
        });
        this.setHandler(ActiveRecord.EVENT_AFTER_VALIDATE, this.afterValidate);
    }

    afterValidate () {
        if (!this.owner.hasError() && !this.owner.isNew()) {
            if (this.owner.isAttrChanged(this.attr)) {
                this.owner.unset(this.attr);
            }
        }
    }
};

const ActiveRecord = require('areto/db/ActiveRecord');