/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('./Mailer');

module.exports = class DummyMailer extends Base {

    async init () {
    }

    forceSend (data) {
        this.log('info', 'Message sent:', data);
        return data;
    }
};