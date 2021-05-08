/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
Jam.ClassHelper = class ClassHelper {

    static normalizeSpawn (config, BaseClass, container) {
        if (!config) {
            return null;
        }
        let spawn = Jam.Helper.parseJson(config) || config;
        if (typeof spawn === 'string') {
            spawn = {Class: spawn};
        }
        if (typeof spawn.Class === 'string') {
            spawn.Class = container ? container[spawn.Class] : Jam[spawn.Class];
        }
        if (typeof spawn.Class !== 'function') {
            return console.error(`Invalid spawn class: ${config}`);
        }
        if (BaseClass && !(spawn.Class.prototype instanceof BaseClass)) {
            return console.error(`Class does not extend base class: ${config}`);
        }
        return spawn;
    }

    static spawn (config, params) {
        config = this.normalizeSpawn(config);
        return config ? new config.Class(Object.assign(config, params)) : null;
    }

    static spawnInstances (items, params) {
        const result = [];
        items = Array.isArray(items) ? items : [];
        for (let item of items) {
            item = this.spawn(item, params);
            if (item) {
                result.push(item);
            }
        }
        return result;
    }
};