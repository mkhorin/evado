/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('./Mailer');

module.exports = class DummyMailer extends Base {

    createTransport () {
        return null;
    }

    directSend (data) {
        this.log('info', 'Message sent:', data);
        return data;
    }
};