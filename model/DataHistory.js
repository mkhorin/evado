/**
 * @copyright Copyright (c) 2020 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('areto/db/ActiveRecord');

module.exports = class DataHistory extends Base {

    static getConstants () {
        return {
            ATTRS: [
                'owner',
                'data',
                'createdAt',
                'user'
            ],
            ATTR_LABELS: {
                createdAt: 'Modification date',
                data: 'Source data'
            },
            TABLE_PREFIX: 'dh_',
            OVERFLOW: 20,
            TRUNCATION: 10
        };
    }

    getTable () {
        return this.TABLE_PREFIX + this.owner.class.name;
    }

    findByOwner () {
        return this.find({owner: this.owner.getId()});
    }

    async append (data) {
        this.assign({
            owner: this.owner.getId(),
            createdAt: new Date,
            user: this.owner.getUserId(),
            data
        });
        await this.insert();
        return this.truncate();
    }

    truncate () {
        return ModelHelper.truncateOverflow({
            query: this.findByOwner(),
            overflow: this.module.getParam('dataHistoryOverflow', this.OVERFLOW),
            truncation: this.module.getParam('dataHistoryTruncation', this.TRUNCATION),
            inBulk: true
        });
    }

    relUser () {
        const Class = this.getClass('model/User');
        return this.hasOne(Class, Class.PK, 'user');
    }
};
module.exports.init(module);

const ModelHelper = require('../component/helper/ModelHelper');