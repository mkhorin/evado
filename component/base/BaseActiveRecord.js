/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('areto/db/ActiveRecord');

module.exports = class BaseActiveRecord extends Base {

    static getConstants () {
        return {
            BEHAVIORS: {
                relationChange: require('areto/behavior/RelationChangeBehavior'),
            }
        };
    }

    getTitle () {
        return this.get('label') || this.get('name') || this.getId();
    }

    getFullTitle () {
        const label = this.get('label');
        const name = this.get('name') || this.getId();
        return label ? `${label} (${name})` : name ;
    }

    findForSelect () {
        return this.find(...arguments).select({name: 1, label: 1}).order({name: 1});
    }

    getIdsWithEmptyRelation (name) {
        if (name && typeof name === 'string') {
            const method = this['getIdsWithEmptyRelation'+ StringHelper.toFirstUpperCase(name)];
            return this[method] ? this[method]() : undefined;
        }
    }
};
module.exports.init();

const StringHelper = require('areto/helper/StringHelper');