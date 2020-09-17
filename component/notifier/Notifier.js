/**
 * @copyright Copyright (c) 2020 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('areto/base/Component');

module.exports = class Notifier extends Base {

    constructor (config) {
        super({
            tasks: [], // message sending task
            messageSource: 'notice', // message translation source
            ...config
        });
    }

    async execute (name, recipients, data) {
        const notice = await this.findNoticeByName(name).one();
        if (!notice) {
            return this.log('error', `Notice not found: ${name}`);
        }
        await this.createMessage(notice, data, recipients);
        return this.executeTasks();
    }

    async executeByNames (names, data) {
        const models = await this.findNoticeByName(names).all();
        return this.executeNotices(models, data);
    }

    async executeById (id, data) {
        const models = await this.findNoticeById(id).all();
        return this.executeNotices(models, data);
    }

    async executeNotices (notices, data) {
        for (const notice of notices) {
            await this.createMessage(notice, data);
        }
        return this.executeTasks();
    }

    executeTasks () {
        return this.module.getScheduler().executeTasks(this.tasks);
    }

    createMessage (notice, data, recipients) {
        return notice.createMessage(data, this.messageSource, recipients);
    }

    findNoticeByName (name) {
        return this.findActiveNotice().and({name});
    }

    findNoticeById (id) {
        return this.findActiveNotice().byId(id);
    }

    findActiveNotice () {
        return this.spawnNotice().find({active: true});
    }

    spawnNotice () {
        return this.spawn('notifier/Notice');
    }
};
module.exports.init(module);