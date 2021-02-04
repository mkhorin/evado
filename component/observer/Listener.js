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
                'notifications',
                'tasks'
            ],
            RULES: [
                ['events', 'required'],
                ['events', 'filter', {method: 'split'}]
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
        const notification = this.resolveNotificationHandler();
        if (notification) {
            handlers.push(notification);
        }
        const task = this.resolveTaskHandler();
        if (task) {
            handlers.push(task);
        }
        return handlers;
    }

    resolveNotificationHandler () {
        const notifications = this.get('notifications');
        if (notifications?.length) {
            return this.spawn('observer/NotificationHandler', {notifications});
        }
    }

    resolveTaskHandler () {
        const tasks = this.get('tasks');
        if (tasks?.length) {
            return this.spawn('observer/TaskHandler', {tasks});
        }
    }
};
module.exports.init(module);