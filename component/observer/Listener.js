/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('areto/db/ActiveRecord');

module.exports = class Listener extends Base {

    static getConstants () {
        return {
            TABLE: 'sys_listener',
            ATTRS: [
                'active',
                'events',
                'description',
                'handlers',
                'notices',
                'tasks'
            ],
            RULES: [
                ['events', 'required'],
                ['events', 'filter', {filter: 'split'}]
            ]
        };
    }

    findActive () {
        return this.find({active: true}).with('handlers');
    }

    relHandlers () {
        const Class = this.getClass('observer/EventHandler');
        return this.hasMany(Class, Class.PK, 'handlers');
    }

    resolveHandlers () {
        const handlers = this.rel('handlers').filter(model => model.resolve());
        const notice = this.resolveNoticeHandler();
        if (notice) {
            handlers.push(notice);
        }
        const task = this.resolveTaskHandler();
        if (notice) {
            handlers.push(task);
        }
        return handlers;
    }

    resolveNoticeHandler () {
        const notices = this.get('notices');
        if (Array.isArray(notices) && notices.length) {
            return this.spawn('observer/NoticeHandler', {notices});
        }
    }

    resolveTaskHandler () {
        const tasks = this.get('tasks');
        if (Array.isArray(tasks) && tasks.length) {
            return this.spawn('observer/TaskHandler', {tasks});
        }
    }
};
module.exports.init(module);