/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('areto/scheduler/Job');

module.exports = class SendNotifications extends Base {

    constructor (config) {
        super({
            nextSendingDelay: 500,
            ...config
        });
    }

    async execute () {
        await this.processUnsentMessage();
    }

    async processUnsentMessage (previous) {
        await PromiseHelper.setTimeout(this.nextSendingDelay);
        const message = this.spawn('notifier/NotificationMessage');
        const query = message.findUnsent();
        if (previous) {
            query.and(['>', message.PK, previous]); // skip previous (possible failed)
        }
        const model = await query.one();
        if (model) {
            await model.truncate();
            await model.send();
            await this.processUnsentMessage(model.getId());
        }
    }
};

const PromiseHelper = require('areto/helper/PromiseHelper');