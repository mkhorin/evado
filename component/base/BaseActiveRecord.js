/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('areto/db/ActiveRecord');

module.exports = class BaseActiveRecord extends Base {

    findForSelect (condition) {
        return this.find(condition).select({name: 1, label: 1}).order({name: 1});
    }

    // EVENTS

    beforeValidate () {
        this.attachBehaviors();
        return super.beforeValidate();
    }

    beforeSave (insert) {
        this.attachBehaviors();
        return super.beforeSave(insert);
    }

    attachBehaviors () {
        this.attachBehaviorOnce('relationChange', RelationChangeBehavior);
    }
};
module.exports.init();

const RelationChangeBehavior = require('areto/behavior/RelationChangeBehavior');