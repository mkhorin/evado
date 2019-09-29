/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('areto/base/Base');

module.exports = class TaskHandler extends Base {

    async execute (data) {
        const scheduler = this.module.getScheduler();
        for (const id of this.tasks) {
            const task = scheduler.getTask(id);
            if (task && task.isActive()) {
                await task.execute(data);
            }
        }
    }
};
module.exports.init();