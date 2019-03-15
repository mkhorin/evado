'use strict';

const Base = require('areto/base/Base');

module.exports = class MetaTransit extends Base {

    async resolve (model) {
        await model.resolveTransitions();
        if (model.transitions.length) {
            await this.security.resolveModelTransitions(model);
        }
    }

    async execute (model, name) {
        if (!name) {
            return;
        }
        if (model.isTransiting()) {
            throw new BadRequest(this.controller.translate('Transition in progress...'));
        }
        await this.resolve(model);
        let item = ArrayHelper.searchByProp(name, 'name', model.transitions);
        if (item instanceof Transition) {
            return model.startTransition(item);
        }
        throw new Error(`Invalid transition: ${name}`);
    }
};

const ArrayHelper = require('areto/helper/ArrayHelper');
const BadRequest = require('areto/error/BadRequestHttpException');
//const Transition = require('areto-meta/base/Transition');