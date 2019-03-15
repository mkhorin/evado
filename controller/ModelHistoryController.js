'use strict';

const Base = require('../component/CrudController');

module.exports = class DataHistoryController extends Base {

    static getConstants () {
        return {
        };
    }

    actionIndexModel () {
        return super.actionIndex({
            template: 'index-model'
        });
    }

    actionListModel () {
        return super.actionList(DataHistory.findByModel(this.getQueryParam('m'), this.getQueryParam('c')));
    }
};
module.exports.init(module);

const DataHistory = require('../model/DataHistory');