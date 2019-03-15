'use strict';

const Base = require('areto/base/Component');

module.exports = class UtilManager extends Base {

    constructor (config) {
        super(config);
        this.url = this.url || `${this.module.NAME}/default/util`;
        this.module.get('meta').onAfterLoad(this.prepare.bind(this));
    }

    prepare () {
        this.moduleUtilMap = this.module.getConfig('utils');
        this.moduleUtils = this.sort(this.moduleUtilMap);
        ObjectHelper.addKeyAsNestedValue('name', this.moduleUtilMap);
        this.projectUtilMap = {};
        this.projectUtils = {};
        for (let project of this.module.get('meta').projects) {
            let items = project.getConfig(`modules.${this.module.NAME}.utils`);
            ObjectHelper.addKeyAsNestedValue('name', items);
            if (items || this.moduleUtilMap) {
                items = {
                    ...this.moduleUtilMap,
                    ...items
                };
                this.projectUtilMap[project.name] = items;
                items = this.sort(items);
                items.forEach(item => this.resolveClass(item, project));
                this.projectUtils[project.name] = items;
            }
        }
    }

    sort (map) {
        return map ? Object.values(map) : null;
    }

    resolveClass (data, project) {
        data.Class = project.require(data.Class);
        if (!(data.Class.prototype instanceof Util)) {
            throw new Error(this.wrapClassMessage('Base class must be Util'))
        }
    }

    async renderTools (controller, project) {
        let result = '';
        for (let util of this.createUtils(controller, project)) {
            try {
                result += await util.renderTool();
            } catch (err) {
                this.log('error', err);
            }
        }
        return result;
    }

    createUtils (controller, project) {
        let items = project
            ? this.projectUtils[project.name]
            : this.moduleUtils;
        if (!(items instanceof Array)) {
            return [];
        }
        let renderParams = controller.getView().getRenderParams();
        let utils = [];
        for (let item of items) {
            item.manager = this;
            item.project = project;
            item.controller = controller;
            item.renderParams = renderParams;
            utils.push(new item.Class(item));
        }
        return utils;
    }

    createUtil (name, project) {
        let item = project
            ? this.projectUtilMap[project.name]
            : this.moduleUtilMap;
        item = item && item[name];
        if (item && item.Class) {
            item.manager = this;
            item.project = project;
            return new item.Class(item);
        }
    }
};
module.exports.init();

const ObjectHelper = require('areto/helper/ObjectHelper');
const Util = require('./Util');