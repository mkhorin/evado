/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('./DataGrid');

module.exports = class TreeDataGrid extends Base {

    static getConstants () {
        return {
            HAS_CHILDREN_KEY: '_node_hasChildren'
        };
    }

    constructor (config) {
        super(config);
        this.depth = this.depth === undefined ? 0 : (this.depth + 1);
    }

    renderModel (model) {
        return Object.assign(super.renderModel(model), {
            [this.HAS_CHILDREN_KEY]: true
        });
    }

};
module.exports.init();