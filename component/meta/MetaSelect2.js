'use strict';

const Base = require('../misc/Select2');

module.exports = class MetaSelect2 extends Base {

    constructor (config) {
        super({
            searchAttrs: config.metaData.view.selectSearchAttrs,
            ...config
        });
    }

    setSearch (text) {
        let conditions = [];
        this.resolveKeyCondition(text, conditions);
        if (Array.isArray(this.searchAttrs)) {
            let stringSearch = this.getStringSearch(text);
            for (let attr of this.searchAttrs) {
                if (attr.isString()) {
                    conditions.push({[attr.name]: stringSearch});
                }
            }
        }
        conditions.length
            ? this.query.andJoinByOr(conditions)
            : this.query.where(['FALSE']);
    }

    resolveKeyCondition (text, conditions) {
        let key = this.query.view.class.key;
        let id = key.normalize(text);
        if (id) {
            conditions.push({[key.name]: id});
        }
    }
};

module.exports.init();