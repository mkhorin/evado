'use strict';

const Base = require('areto/base/Base');

module.exports = class ModuleView extends Base {

    constructor (config) {
        super({
            // project: new areto-meta/base/Project
            // module: new areto/base/Module
            ...config
        });
        this.root = this.project.getPath('module', this.module.NAME);
        this.createDefault();
        this.createClassMap();
        this.createViewMap();
    }

    // config:
        // skip project module view !
        // set theme name

    getTheme (name, view) {
        let themeSet = this.themeSet;
        if (!view) {
            return themeSet.get(name);
        }
        if (view !== view.class) {
            themeSet = this.getViewThemeSet(view.name);
            if (themeSet) {
                return themeSet.get(name);
            }
        }
        themeSet = this.getClassThemeSet(view.class.name);
        return themeSet ? themeSet.get(name) : this.themeSet.get(name);
    }

    getClassThemeSet (name) {
        return this.classMap[name] instanceof ThemeSet ? this.classMap[name] : null;
    }

    getViewThemeSet (viewName, className) {
        return this.viewMap[className] && this.viewMap[className][viewName] instanceof ThemeSet
            ? this.viewMap[className][viewName] : null;
    }

    createThemeSet (config) {
        return ClassHelper.createInstance(ThemeSet, {
            'dir': this.root,
            ...config
        });
    }

    createDefault () {
        this.themeSet = this.createThemeSet({
            'parent': this.module.get('view').themeSet
        });
        if (this.themeSet.isEmpty()) {
            this.themeSet = this.themeSet.parent;
        }
    }

    createClassMap () {
        this.classMap = {};
        this.setClassMapByDir(path.join(this.root, 'view', '_class'));
        this.setClassMapByDir(path.join(this.root, 'theme', '_class'));
    }

    setClassMapByDir (dir) {
        for (let className of FileHelper.readDirWithoutError(dir)) {
            if (this.getClassThemeSet(className)) {
                continue;
            }
            let set = this.createThemeSet({
                'defaultThemeDir': `view/_class/${className}`,
                'themeDir': `theme/_class/${className}`,
                'parent': this.themeSet
            });
            if (!set.isEmpty()) {
                this.classMap[className] = set;
            }
        }
    }

    createViewMap () {
        this.viewMap = {};
        this.setViewMapByDir(path.join(this.root, 'view', '_view'));
        this.setViewMapByDir(path.join(this.root, 'theme', '_view'));
    }

    setViewMapByDir (dir) {
        for (let className of FileHelper.readDirWithoutError(dir)) {
            for (let viewName of FileHelper.readDirWithoutError(path.join(dir, className))) {
                if (!this.getViewThemeSet(className)) {
                    this.createViewSet(className, viewName);
                }
            }
        }
    }

    createViewSet (className, viewName) {
        let set = this.createThemeSet({
            'defaultThemeDir': `view/_view/${className}/${viewName}`,
            'themeDir': `theme/_view/${className}/${viewName}`,
            'parent': this.getClassThemeSet(className) || this.themeSet
        });
        if (!set.isEmpty()) {
            if (typeof this.viewMap[className] !== 'object') {
                this.viewMap[className] = {};
            }
            this.viewMap[className][viewName] = set;
        }
    }
};

const path = require('path');
const ClassHelper = require('areto/helper/ClassHelper');
const FileHelper = require('areto/helper/FileHelper');
const ThemeSet = require('areto/view/ThemeSet');