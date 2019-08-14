/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('areto/db/ActiveRecord');

module.exports = class BaseActiveRecord extends Base {

    getTitle () {
        return this.get('label') || this.get('name') || this.getId();
    }

    getFullTitle () {
        const label = this.get('label');
        const name = this.get('name') || this.getId();
        return label ? `${label} (${name})` : name ;
    }

    findForSelect (condition) {
        return this.find(condition).select({name: 1, label: 1}).order({name: 1});
    }

    getIdsWithEmptyRelation (name) {
        if (name && typeof name === 'string') {
            const method = this['getIdsWithEmptyRelation'+ StringHelper.toFirstUpperCase(name)];
            return this[method] ? this[method]() : undefined;
        }
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

const StringHelper = require('areto/helper/StringHelper');
const RelationChangeBehavior = require('areto/behavior/RelationChangeBehavior');