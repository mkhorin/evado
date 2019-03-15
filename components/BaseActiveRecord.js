'use strict';

const Base = require('areto/db/ActiveRecord');

module.exports = class BaseActiveRecord extends Base {

    static findForSelect (condition) {
        return this.find(condition).select({
            'name': 1,
            'caption': 1
        }).order({
            'name': 1
        });
    }

    // EVENTS

    beforeValidate () {
        this.attachBehaviors();
        return super.beforeValidate();
    }

    beforeSave (insert) {
        this.attachBehaviors();
        return super.beforeSave(insert);
    }

    attachBehaviors () {
        this.attachBehaviorOnce('relationChange', RelationChangeBehavior);
    }

    // HANDLERS

    /*
    async handlerRelation (name, options) {
        let models = this.findRelation(name);
        this.setViewAttr(name, await this.toDofunc(models));
    }

    toDofunc (models) {
        let values = [];
        if (!models) {
            return values;
        }
        if (!(models instanceof Array)) {
            models = [models];
        }
        for (let model of models) {
            values.push({
                id: model.getId(),
                title: model.getTitle()
            });
        }
        return values;
    } //*/

};
module.exports.init();

const RelationChangeBehavior = require('areto/behavior/RelationChangeBehavior');