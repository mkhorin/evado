/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('areto/base/Component');

module.exports = class Notifier extends Base {

    constructor (config) {
        super({
            // tasks: [],
            messageSource: 'notice',
            ...config
        });
    }

    async createNotification (name, data) {
        const notice = await this.findNotice(name).one();
        if (!notice) {
            return this.log('error', `Notice not found: ${name}`);
        }
        const message = await this.createMessage(notice, data);
        if (message) {
            return message.send();
        }
    }

    async execute (notices, data) {
        const models = await this.findNoticeById(notices).all();
        for (const model of models) {
            await this.createMessage(model, data);
        }
        return this.module.getScheduler().executeTasks(this.tasks);
    }

    createMessage (notice, data) {
        return notice.createMessage(data, this.messageSource);
    }

    findNotice (name) {
        return this.spawnNotice().find({name, active: true});
    }

    findNoticeById (id) {
        return this.spawnNotice().findById(id).and({active: true});
    }

    spawnNotice () {
        return this.spawn('notifier/Notice');
    }
};
module.exports.init(module);