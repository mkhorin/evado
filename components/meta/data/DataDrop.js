'use strict';

const Base = require('areto/base/Base');

module.exports = class DataDrop extends Base {

    async execute () {
        if (this.project.classes instanceof Array) {
            for (let cls of this.project.classes) {
                await cls.dropData();
            }
        }
    }
};