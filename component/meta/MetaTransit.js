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
            // sort transitions after security filtering
            model.transitions.sort(MetaHelper.compareByDataOrderNumber);
        }
    }

    async execute (model, name) {
        if (model.isTransiting()) {
            throw new Locked(`Transition in progress: ${name}.${model.getMetaId()}`);
        }
        await model.resolveTransitions(name);
        if (!model.transitions.length) {
            throw new BadRequest(`Invalid transition: ${name}.${model.getMetaId()}`);
        }
        await this.security.resolveModelTransitions(model);
        const transition = model.transitions[0];
        if (transition instanceof Transition) {
            return model.transit(transition);
        }
        throw new Forbidden(`Transition is forbidden: ${name}.${model.getMetaId()}`);
    }
};

const BadRequest = require('areto/error/http/BadRequest');
const Forbidden = require('areto/error/http/Forbidden');
const Locked = require('areto/error/http/Locked');
const MetaHelper = require('../helper/MetaHelper');
const Transition = require('evado-meta-base/workflow/Transition');