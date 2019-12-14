/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('../misc/CommonSearch');

module.exports = class MetaCommonSearch extends Base {

    resolve (query, search) {
        const view = query.view;
        const conditions = [];
        for (const attr of view.commonSearchAttrs) {
            const value = attr.isDate() ? this.getDateValue(search) : search;
            const condition = attr.getSearchCondition(value);
            if (condition) {
                conditions.push(condition);
            }
        }
        if (!view.commonSearchAttrs.includes(view.class.getKey())) {
            const condition = view.class.key.getCondition(search);
            if (condition) {
                conditions.push(condition);
            }
        }
        conditions.length
            ? query.and(['OR', ...conditions])
            : query.where(['FALSE']);
    }

    getDateValue (value) {
        if (this._dateValue === undefined) {
            this._dateValue = DateHelper.parse(value, this.controller.language);
        }
        return this._dateValue;
    }
};

const DateHelper = require('areto/helper/DateHelper');