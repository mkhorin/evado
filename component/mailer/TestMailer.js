/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('./Mailer');

module.exports = class TestMailer extends Base {

    constructor (config) {
        super(config);
        const defaults = this.getDefaultSettings();
        this.settings = Object.assign(defaults, this.settings);
    }

    getDefaultSettings () {
        return {
            host: 'smtp.ethereal.email',
            port: 587
        };
    }

    async init () {
        if (!this.settings.auth) {
            this.settings.auth = await this.engine.createTestAccount();
        }
        return super.init();
    }

    async directSend (data) {
        const result = await super.directSend(data);
        const url = this.engine.getTestMessageUrl(result);
        this.log('info', 'Preview:', url);
        return result;
    }
};