/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('areto/base/Component');

module.exports = class Observer extends Base {

    async init () {
        await this.load();
    }

    async load () {
        this._eventMap = {};
        this._listeners = await this.spawn('observer/Listener').findActive().all();
        for (const listener of this._listeners) {
            this.attachListener(listener.get('events'), listener.resolveHandlers());
        }
    }

    attachListener (events, handlers) {
        if (!Array.isArray(events) || !handlers.length) {
            return;
        }
        for (const name of events) {
            if (Array.isArray(this._eventMap[name])) {
                this._eventMap[name].push(...handlers);
            } else {
                this._eventMap[name] = handlers;
            }
        }
    }

    catch (event, data) {
        if (Array.isArray(this._eventMap[event])) {
            return this.handle(event, data);
        }
    }

    async handle (event, data) {
        data = {...data, event};
        for (const handler of this._eventMap[event]) {
            try {
                await handler.execute(data);
            } catch (err) {
                this.log('error', `Event: ${event}: Handler failed: ${handler}:`, err);
            }
        }
    }
};
module.exports.init();