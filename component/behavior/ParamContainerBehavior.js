/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('areto/base/Behavior');

module.exports = class ParamContainerBehavior extends Base {

    constructor (config) {
        super({
            typeAttr: 'type',
            paramRelationName: 'param',
            ...config
        });
    }

    getType () {
        return this.owner.get(this.typeAttr);
    }

    getParamMap () {
        return this.owner.PARAM_MAP;
    }

    getParamClass () {
        return this.getParamMap()[this.getType()];
    }

    getParamModel () {
        const model = this.owner.rel(this.paramRelationName);
        if (model) {
            model.paramContainer = this.owner;
            return model;
        }
        const Class = this.getParamClass();
        return Class ? this.createParamModel(Class) : null;
    }

    getParamModelMap () {
        const result = {};
        const type = this.getType();
        const paramMap = this.getParamMap();
        for (const key of Object.keys(paramMap)) {
            result[key] = key === type
                ? this.getParamModel()
                : this.createParamModel(paramMap[key]);
        }
        return result;
    }

    createParamModel (config) {
        return this.spawn(config, {paramContainer: this.owner});
    }
};