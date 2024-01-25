/**
 * @copyright Copyright (c) 2020 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('areto/base/Base');

module.exports = class MetadataClassInstantiation extends Base {

    /**
     * @param {Object} config
     * @param {string} config.className - Metadata class name
     */
    constructor (config) {
        super({
            userAttr: 'user',
            ...config
        });
    }

    async execute ({user}) {
        const model = this.createModel({user});
        await model.setDefaultValues();
        this.setValues(model);
        if (!await model.save()) {
            throw model.getFirstError();
        }
    }

    createModel (params) {
        const {module} = this;
        const cls = module.getBaseMeta().getClass(this.className);
        return cls.createModel({module, ...params});
    }

    setValues (model) {
        if (this.userAttr) {
            model.set(this.userAttr, model.user.getId());
        }
    }
};