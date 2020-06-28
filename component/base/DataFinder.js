/**
 * @copyright Copyright (c) 2020 Maxim Khorin (maksimovichu@gmail.com)
 */
'use strict';

const Base = require('areto/base/Base');

module.exports = class DataFinder extends Base {

    constructor (config) {
        super({
            command: config.field ? 'scalar' : 'id',
            ...config
        });
    }

    execute (params) {
        const query = this.find(...arguments);
        if (params.condition) {
            query.and(params.condition);
        }
        return query[this.command](this.field);
    }
};