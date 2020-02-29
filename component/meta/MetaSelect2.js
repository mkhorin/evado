/**
 * @copyright Copyright (c) 2020 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('../other/Select2');

module.exports = class MetaSelect2 extends Base {

    constructor (config) {
        super({
            searchAttrs: config.query.view.selectSearchAttrs,
            ...config
        });
    }

    setSearch (text) {
        const conditions = [];
        this.resolveKeyCondition(text, conditions);
        if (Array.isArray(this.searchAttrs)) {
            const stringValue = this.getStringSearch(text);
            const numberValue = parseFloat(text);
            for (const attr of this.searchAttrs) {
                if (attr.isString()) {
                    conditions.push({[attr.name]: stringValue});
                } else if (attr.isNumber() && !isNaN(numberValue)) {
                    conditions.push({[attr.name]: numberValue});
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