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
                'notices'
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
        const notices = this.get('notices');
        if (Array.isArray(notices) && notices.length) {
            handlers.push(this.spawn('observer/NoticeHandler', {notices}));
        }
        const tasks = this.get('tasks');
        if (Array.isArray(tasks) && tasks.length) {
            handlers.push(this.spawn('observer/TaskHandler', {tasks}));
        }
        return handlers;
    }
};
module.exports.init(module);