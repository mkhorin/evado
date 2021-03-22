/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
Jam.Events = class Events {

    constructor (prefix, params) {
        this.prefix = prefix;
        this.$target = $('<div/>');
        this.params = params || {};
    }

    on (name, handler, data) {
        this.$target.on(this.getName(name), handler, data);
    }

    one (name, handler, data) {
        this.$target.one(this.getName(name), handler, data);
    }

    off (name, handler, data) {
        this.$target.off(this.getName(name), handler, data);
    }

    trigger (name, data) {
        this.$target.trigger(this.getName(name), data);
    }

    getName (name) {
        return this.prefix + name;
    }
};