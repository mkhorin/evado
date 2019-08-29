/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('areto/scheduler/Job');

module.exports = class NoticeMessageJob extends Base {

    run () {
       return this.runPending();
    }

    async runPending (prevId) {
        await PromiseHelper.setTimeout(500);
        let model = this.spawn('notifier/NoticeMessage');
        let query = model.findPending();
        if (prevId) {
            query.and(['>', model.PK, prevId]); // skip prev (possible failed)
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