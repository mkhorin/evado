/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('areto/base/Base');

module.exports = class Listener extends Base {

    constructor (config) {
        super({
            // recipient: [Recipient]
            // event: [Event]
            // notifier
            // method: [methods]
            ...config
        });
        this._listeners = [];
    }

    catch (name, data) {

    }
};
module.exports.init();