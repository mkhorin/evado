/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
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
        const conditions = [];
        this.resolveKeyCondition(text, conditions);
        if (Array.isArray(this.searchAttrs)) {
            const stringSearch = this.getStringSearch(text);
            for (const attr of this.searchAttrs) {
                if (attr.isString()) {
                    conditions.push({[attr.name]: stringSearch});
                }
            }
        }
        conditions.length
            ? this.query.and(['OR', ...conditions])
            : this.query.where(['FALSE']);
    }

    resolveKeyCondition (text, conditions) {
        const key = this.query.view.class.key;
        const id = key.normalize(text);
        if (id) {
            conditions.push({[key.name]: id});
        }
    }
};

module.exports.init();