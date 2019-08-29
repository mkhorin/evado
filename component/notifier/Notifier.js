/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('areto/base/Component');

module.exports = class Notifier extends Base {

    constructor (config) {
        super({
            tasks: [], //['noticeMessageSending'],
            ...config
        });
    }

    async execute (notices, data) {
        const models = await this.spawnNotice().findById(notices).and({active: true}).all();
        for (const model of models) {
            await model.execute(data);
        }
        return this.module.getScheduler().executeTasks(this.tasks);
    }

    spawnNotice () {
        return this.spawn('notifier/Notice');
    }
};
module.exports.init(module);