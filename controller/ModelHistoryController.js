'use strict';

const Base = require('../component/base/CrudController');

module.exports = class DataHistoryController extends Base {

    static getConstants () {
        return {
        };
    }

    actionIndexModel () {
        return super.actionIndex({template: 'index-model'});
    }

    actionListModel () {
        let model = this.spawn(DataHistory);
        return super.actionList(model.findByModel(this.getQueryParam('m'), this.getQueryParam('c')));
    }
};
module.exports.init(module);

const DataHistory = require('../model/DataHistory');