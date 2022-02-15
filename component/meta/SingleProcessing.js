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
            this.log('info', `Start: ${name}`);
            const result = await handler();
            this.log('info', `End: ${name}`);
            this._busy = false;
            return result;
        } catch (err) {
            this._busy = false;
            throw err;
        }
    }

    log () {
        CommonHelper.log(this.owner, this.constructor.name, ...arguments);
    }
};

const CommonHelper = require('areto/helper/CommonHelper');