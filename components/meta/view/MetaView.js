'use strict';

const Base = require('areto/base/Component');

module.exports = class MetaView extends Base {

    static getConstants () {
        return {
            DISABLED_PARAM: 'metaViewDisabled'
        };
    }

    constructor (config) {
        super({
            // disabled: // disable all project views
            ...config
        });
    }

    init () {
        this.module.on(this.module.EVENT_AFTER_INIT, this.configure.bind(this));
    }

    configure () {
        this.createProjectViews();
    }

    getMeta () {
        return this.module.get('meta');
    }

    createProjectViews () {
        this._projectViewMap = {};
        if (this.disabled) {
            return this.log('warn', 'View disabled');
        }
        for (let project of this.getMeta().projects) {
            if (project.getParam(this.DISABLED_PARAM)) {
                this.log('warn', `View disabled for project: ${project.name}`);
                continue;
            }
            this._projectViewMap[project.id] = new ProjectView({
                'project': project,
                'view': this
            });
        }
    }

    getProjectView (id) {
        if (this._projectViewMap[id] instanceof ProjectView) {
            return this._projectViewMap[id];
        }
    }

    getTheme (module, metaData, name) {
        let view = this.getProjectView(metaData.project.name);
        view = view && view.getModuleView(module.NAME);
        return view
            ? view.getTheme(name, metaData.view)
            : module.get('view').getTheme(name);
    }
};
module.exports.init();

const ProjectView = require('./ProjectView');