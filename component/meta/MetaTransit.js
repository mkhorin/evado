/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('areto/base/Base');

module.exports = class MetaTransit extends Base {

    async resolve (model, readOnly) {
        await model.resolveTransitions();
        if (model.transitions.length) {
            await this.security.resolveModelTransitions(model, readOnly);
            // sort transitions after security filtering
            model.transitions.sort(MetaHelper.compareByDataOrderNumber);
        }
    }

    async execute (model, name, readOnly) {
        if (model.isTransiting()) {
            throw new Locked('Transition in progress...');
        }
        await this.resolve(model, readOnly);
        const transition = ArrayHelper.searchByProperty(name, 'name', model.transitions);
        if (transition instanceof Transition) {
            return model.transit(transition);
        }
        throw new BadRequest(`Invalid transition: ${name}.${model.getMetaId()}`);
    }
};

const ArrayHelper = require('areto/helper/ArrayHelper');
const BadRequest = require('areto/error/http/BadRequest');
const Locked = require('areto/error/http/Locked');
const MetaHelper = require('../helper/MetaHelper');
const Transition = require('evado-meta-base/workflow/Transition');