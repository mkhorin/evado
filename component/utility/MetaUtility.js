/**
 * @copyright Copyright (c) 2020 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('./Utility');

module.exports = class MetaUtility extends Base {

    getBaseMeta () {
        return this.module.getBaseMeta();
    }

    createMetaSecurity (config) {
        return this.spawn(MetaSecurity, {
            controller: this.controller,
            ...config
        });
    }

    findModel (id, view, params) {
        return id && view ? view.findById(id, this.getSpawnConfig(params)) : null;
    }

    createModel (view, params) {
        return view.createModel(this.getSpawnConfig(params));
    }

    parseBaseMeta (data = this.postParams.meta) {
        if (typeof data !== 'string') {
            return data;
        }
        const index = data.indexOf('.');
        const className = data.substring(index + 1);
        const viewName = data.substring(0, index);
        const meta = this.getBaseMeta();
        const result = {meta};
        result.class = meta.getClass(className);
        if (result.class) {
            result.view = result.class.getView(viewName) || result.class;
        }
        return result;
    }
};

const MetaSecurity = require('../meta/MetaSecurity');