/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('areto/scheduler/Job');

module.exports = class CreateNotificationJob extends Base {

    constructor (config) {
        super({
            nextSendingDelay: 500,
            ...config
        });
    }

    run () {
        return this.runPending();
    }

    async runPending (previous) {
        await PromiseHelper.setTimeout(this.nextSendingDelay);
        let model = this.spawn('notifier/NoticeMessage');
        let query = model.findPending();
        if (previous) {
            query.and(['>', model.PK, previous]); // skip previous (possible failed)
        }
        model = await query.one();
        if (model) {
            await model.truncate();
            await model.send();
            await this.runPending(model.getId());
        }
    }
};
module.exports.init(module);

const PromiseHelper = require('areto/helper/PromiseHelper');