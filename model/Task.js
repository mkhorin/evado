/**
 * @copyright Copyright (c) 2020 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('areto/db/ActiveRecord');

module.exports = class Task extends Base {

    static getConstants () {
        return {
            TABLE: 'sys_tasks',
            ATTRS: [
                'active',
                'name',
                'description',
                'startup', // run at server startup
                'startDate', // Date
                'startTime', // 00:00:00
                'period', // duration
                'repeats', // 0 (endless)
                'stopOnFail',
                'job',
                'lastDoneAt'
            ],
            RULES: [
                [['name', 'job'], 'required'],
                [['name', 'description'], 'string'],
                ['name', 'regex', {pattern: /^[0-9a-zA-Z-]+$/}],
                ['name', 'unique'],
                ['startDate', 'date'],
                ['startTime', 'regex', {pattern: 'HH:mm:ss'}],
                [['active', 'startup', 'stopOnFail'], 'checkbox'],
                ['repeats', 'number', {integerOnly: true}],
                ['period', 'regex', {pattern: 'duration'}],
                [['period', 'repeats'], 'default', {value: 0}],
                ['job', 'spawn', {BaseClass: require('areto/scheduler/Job')}]
            ]
        };
    }
    
    resolve () {
        try {
            const data = {...this.getAttrMap()};
            data.job = CommonHelper.parseJson(data.job);
            data.job = ClassHelper.resolveSpawn({...data.job}, this.module.app);
            return data;
        } catch (err) {
            this.log('error', 'Invalid job:', err);
        }
    }

    async execute () {
        const task = this.module.getScheduler().getTask(this.getId());
        if (!task) {
            return this.addError('error', 'Task not found');
        }
        const result = new Promise(done => {
            task.once(task.EVENT_DONE, done);
            task.once(task.EVENT_FAIL, ({error}) => done(this.addError('error', error)));
        });
        await task.execute();
        return result;
    }

    saveDone () {
        return this.directUpdate({lastDoneAt: new Date});
    }
};
module.exports.init(module);

const ClassHelper = require('areto/helper/ClassHelper');
const CommonHelper = require('areto/helper/CommonHelper');