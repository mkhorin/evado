/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
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
        if (model.isTransiting()) {
            throw new Forbidden('Transition in progress...');
        }
        await this.resolve(model);
        const transition = ArrayHelper.searchByProperty(name, 'name', model.transitions);
        if (transition instanceof Transition) {
            return model.transit(transition);
        }
        throw new BadRequest(`Invalid transition: ${name}: ${model.getMetaId()}`);
    }
};

const ArrayHelper = require('areto/helper/ArrayHelper');
const BadRequest = require('areto/error/http/BadRequest');
const Forbidden = require('areto/error/http/Forbidden');
const Transition = require('evado-meta-base/workflow/Transition');