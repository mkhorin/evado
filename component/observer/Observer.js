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
        const query = this.spawn('observer/Listener').findActive();
        this._listeners = await query.all();
        for (const listener of this._listeners) {
            const events = listener.get('events');
            const handlers = listener.resolveHandlers();
            this.attachListener(events, handlers);
        }
    }

    attachListener (events, handlers) {
        if (typeof events === 'string') {
            events = events.split(',');
        }
        if (!Array.isArray(events)) {
            return;
        }
        if (typeof handlers === 'function') {
            handlers = [handlers];
        }
        if (!Array.isArray(handlers) || !handlers.length) {
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
        if (data) {
            data = {...data};
        }
        const events = this._parsedMap[originalEvent];
        for (const event of events) {
            const handlers = this._eventMap[event];
            for (const handler of handlers) {
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
            const name = event.substring(0, index);
            const events = this.parseEventName(name);
            if (events) {
                result.push(...events);
            }
        }
        return result.length ? result : null;
    }
};
module.exports.init();