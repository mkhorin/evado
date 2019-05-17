'use strict';

const Base = require('areto/db/ActiveRecord');

module.exports = class DataHistory extends Base {

    static getConstants () {
        return {
            TABLE: 'doc_dataHistory',
            ATTRS: [
                'attr',
                'class',
                'model',
                'value',
                'createdAt',
                'user'
            ]
        };
    }

    static findByModel (id, classFullName) {
        return this.find({
            class: classFullName,
            model: this.getDb().normalizeId(id)
        }).with('user');
    }

    setData (data) {
        this.assignAttrs({
            attr: data.attr.name,
            class: data.attr.class.id,
            model: data.model.getId(),
            value: data.value,
            createdAt: new Date,
            user: data.user ? data.user.getId() : null
        });
    }

    relUser () {
        return this.hasOne(User, User.PK, 'user');
    }
};
module.exports.init();

const User = require('./User');