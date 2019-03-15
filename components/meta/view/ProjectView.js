'use strict';

const Base = require('areto/base/Base');

module.exports = class ProjectView extends Base {

    static getConstants () {
        return {
            VIEW_DISABLED_PARAM: 'metaViewDisabled'
        };
    }

    constructor (config) {
        super({
            // view: new MetaView
            // project: new Project
            ...config
        });
        this.createModuleViews();
    }
    
    createModuleViews () {
        this._moduleViews = {};
        for (let module of this.view.module.modules.values()) {
            if (module.getParam(this.view.DISABLED_PARAM)) {
                this.view.log('warn', `View disabled for module: ${module.NAME}`);
            } else if (this.project.getModuleParam(module.NAME, this.view.DISABLED_PARAM)) {
                this.view.log('warn', `View disabled for project: ${this.project.name}: module: ${module.NAME}`);
            } else {
                this._moduleViews[module.NAME] = new ModuleView({
                    'module': module,
                    'project': this.project
                });
            }
        }
    }

    getModuleView (name) {
        if (this._moduleViews[name] instanceof ModuleView) {
            return this._moduleViews[name];
        }
    }
};
module.exports.init();

const ModuleView = require('./ModuleView');