'use strict';

const Base = require('areto/validator/Validator');

module.exports = class ClassValidator extends Base {

    getMessage () {
        return this.createMessage(this.message, 'Invalid file');
    }

    getBaseClassMessage () {
        return this.createMessage(this.wrongBaseClass, 'Base class must be {name}', {
            name: this.BaseClass.name
        });
    }

    validateAttr (model, attr) {
        let value = model.get(attr);
        try {
            let Class = model.module.app.require(value);
            if (this.BaseClass && !(Class.prototype instanceof this.BaseClass)) {
                this.addError(model, attr, this.getBaseClassMessage());
            }
        } catch (err) {
            this.addError(model, attr, this.getMessage());
        }
    }
};

const Message = require('areto/i18n/Message');