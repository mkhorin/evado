/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('./Mailer');

module.exports = class TestMailer extends Base {

    constructor (config) {
        super(config);
        this.settings = Object.assign({
            host: 'smtp.ethereal.email',
            port: 587
        }, this.settings);
    }

    async init () {
        if (!this.settings.auth) {
            this.settings.auth = await this.engine.createTestAccount();
        }
        return super.init();
    }

    async directSend (data) {
        const result = await super.directSend(data);
        this.log('info', 'Preview:', this.engine.getTestMessageUrl(result));
        return result;
    }
};