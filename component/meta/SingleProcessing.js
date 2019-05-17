/**
 * @copyright Copyright (c) 2019 Maxim Khorin (maksimovichu@gmail.com)
 */
'use strict';

const Base = require('areto/base/Base');

module.exports = class SingleProcessing extends Base {

    _busy = false;
    
    constructor (config) {
        super({
            busyMessage: 'Processing in progress',
            ...config
        });
    }

    isBusy () {
        return this._busy;
    }

    async execute (handler, name) {
        if (this.isBusy()) {
            throw new Error(this.owner.translate(this.busyMessage));
        }
        this._busy = true;
        try {
            this.log('info', `Start processing: ${name || util.inspect(handler)}`);
            let result = await handler();
            this.log('info', 'End processing');
            this._busy = false;
            return result;
        } catch (err) {
            this._busy = false;
            throw err;
        }
    }

    log (type, message, data) {
        CommonHelper.log(type, message, data, this.constructor.name, this.owner);
    }
};

const util = require('util');
const CommonHelper = require('areto/helper/CommonHelper');