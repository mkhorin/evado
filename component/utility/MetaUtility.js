/**
 * @copyright Copyright (c) 2020 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('./Utility');

module.exports = class MetaUtility extends Base {

    createMetaSecurity (config) {
        return this.spawn(MetaSecurity, {
            controller: this.controller,
            ...config
        });
    }

    findModel (id, view) {
        return id && view ? view.findById(id, this.controller.getSpawnConfig()) : null;
    }

    resolveBaseMeta (data = this.postParams.meta) {
        if (typeof data !== 'string') {
            return data;
        }
        const index = data.indexOf('.');
        const className = data.substring(index + 1);
        const viewName = data.substring(0, index);
        const meta = this.module.getBaseMeta();
        const result = {};
        result.class = meta.getClass(className);
        if (result.class) {
            result.view = result.class.getView(viewName) || result.class;
        }
        return result;
    }
};

const MetaSecurity = require('../meta/MetaSecurity');