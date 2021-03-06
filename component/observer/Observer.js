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
        this._parsedMap = {};
        this._listeners = await this.spawn('observer/Listener').findActive().all();
        for (const listener of this._listeners) {
            this.attachListener(listener.get('events'), listener.resolveHandlers());
        }
    }

    attachListener (events, handlers) {
        if (typeof events === 'string') {
            events = events.split(',');
        }
        if (typeof handlers === 'function') {
            handlers = [handlers];
        }
        if (!Array.isArray(events) || !Array.isArray(handlers) || !handlers.length) {
            return;
        }
        for (const name of events) {
            if (Array.isArray(this._eventMap[name])) {
                this._eventMap[name].push(...handlers);
            } else {
                this._eventMap[name] = handlers;
            }
            delete this._parsedMap[name];
        }
    }

    handle (event, data) {
        if (!Object.prototype.hasOwnProperty.call(this._parsedMap, event)) {
            this._parsedMap[event] = this.parseEventName(event);
        }
        if (this._parsedMap[event]) {
            return this.handleInternal(event, data);
        }
    }

    async handleInternal (originalEvent, data) {
        data = data ? {...data} : data;
        for (const event of this._parsedMap[originalEvent]) {
            for (const handler of this._eventMap[event]) {
                try {
                    await handler.execute(data, event, originalEvent);
                } catch (err) {
                    this.log('error', `Event: ${event}: ${handler}:`, err);
                }
            }
        }
    }

    parseEventName (event) {
        const result = [];
        if (Array.isArray(this._eventMap[event])) {
            result.push(event);
        }
        const index = event.lastIndexOf('.');
        if (index !== -1) {
            const events = this.parseEventName(event.substring(0, index));
            if (events) {
                result.push(...events);
            }
        }
        return result.length ? result : null;
    }
};
module.exports.init();