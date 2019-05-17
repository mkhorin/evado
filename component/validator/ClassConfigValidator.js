'use strict';

const Base = require('areto/validator/Validator');

module.exports = class ClassConfigValidator extends Base {

    getMessage () {
        return this.createMessage(this.message, 'Invalid class config');
    }

    getBaseClassMessage () {
        return this.createMessage(this.wrongBaseClass, 'Base class must be {name}', {
            name: this.BaseClass.name
        });
    }

    getInvalidFileMessage () {
        return this.createMessage(this.wrongBaseClass, 'Invalid class file', {
            name: this.BaseClass.name
        });
    }

    validateAttr (model, attr) {
        let value = model.get(attr);
        if (typeof value === 'string') {
            value = CommonHelper.parseJson(value);
        }
        if (!value) {
            return this.addError(model, attr, this.getMessage());
        }
        try {
            let Class = model.module.app.require(value.Class);
            if (this.BaseClass && !(Class.prototype instanceof this.BaseClass)) {
                this.addError(model, attr, this.getBaseClassMessage());
            } else {
                model.set(attr, value);
            }
        } catch (err) {
            this.addError(model, attr, this.getInvalidFileMessage());
        }
    }
};

const CommonHelper = require('areto/helper/CommonHelper');