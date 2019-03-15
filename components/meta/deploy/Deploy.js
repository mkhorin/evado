'use strict';

const Base = require('areto/base/Base');

module.exports = class Deploy extends Base {

    static getConstants () {
        return {
            PROJECT_FILE: 'project.json',
            META_CLASS_DIR: 'meta/class',
            META_VIEW_DIR: 'meta/view',
            META_NAV_DIR: 'meta/nav',
            META_REPORT_DIR: 'meta/report',
            MODULE_DIR: 'module',
        }
    }

    async execute () {
        await this.insertProject();
        await this.insertClasses();
        await this.insertReports();
        await this.insertNav();
        await this.insertModules();
    }

    getPath (...args) {
        return path.join.apply(path, [this.dir].concat(args));
    }

    getBaseName (file) {
        return path.basename(file, '.json');
    }

    insertProject () {
        let data = FileHelper.readJsonFile(this.getPath(this.PROJECT_FILE));
        this.projectName = path.basename(this.dir);
        data.name = this.projectName;
        return this.meta.insert('project', data);
    }

    // CLASSES

    async insertClasses () {
        for (let file of FileHelper.readDirWithoutError(this.getPath(this.META_CLASS_DIR))) {
            if (FileHelper.isJsonExt(file)) {
                await this.insertClass(this.getBaseName(file));
            }
        }
    }

    async insertClass (name) {
        let dir = this.getPath(this.META_CLASS_DIR, `${name}.json`);
        let data = FileHelper.readJsonFile(dir);
        data.project = this.projectName;
        data.name = name;
        await this.meta.insert('class', data);
        await this.insertViews(name);
        await PromiseHelper.setImmediate();
    }

    // VIEWS

    async insertViews (className) {
        let dir = this.getPath(this.META_VIEW_DIR, className);
        for (let file of FileHelper.readDirWithoutError(dir)) {
            if (FileHelper.isJsonExt(file)) {
                await this.insertView(this.getBaseName(file), className);
            }
        }
    }

    insertView (name, className) {
        let file = this.getPath(this.META_VIEW_DIR, className, `${name}.json`);
        let data = FileHelper.readJsonFile(file);
        data.project = this.projectName;
        data.class = className;
        data.name = name;
        return this.meta.insert('view', data);
    }

    // REPORTS

    async insertReports () {
        for (let file of FileHelper.readDirWithoutError(this.getPath(this.META_REPORT_DIR))) {
            if (FileHelper.isJsonExt(file)) {
                await this.insertReport(this.getBaseName(file));
            }
        }
    }

    async insertReport (name) {
        let dir = this.getPath(this.META_REPORT_DIR, `${name}.json`);
        let data = FileHelper.readJsonFile(dir);
        data.project = this.projectName;
        data.name = name;
        await this.meta.insert('report', data);
        await PromiseHelper.setImmediate();
    }

    // NAV

    async insertNav () {
        let dir = this.getPath(this.META_NAV_DIR);
        for (let file of FileHelper.readDirWithoutError(dir)) {
            if (FileHelper.isJsonExt(file)) {
                let data = FileHelper.readJsonFile(path.join(dir, file));
                data.project = this.projectName;
                data.name = this.getBaseName(file);
                await this.insertNavItems(data);
                delete data.items;
                await this.meta.insert('navSection', data);
                await PromiseHelper.setImmediate();
            }
        }
    }

    insertNavItems (data) {
        data.items = data.items instanceof Array ? data.items : [];
        for (let item of data.items) {
            item.project = this.projectName;
            item.section = data.name;
        }
        if (data.items.length) {
            return this.meta.insert('navItem', data.items);
        }
    }

    // MODULES

    async insertModules () {
        let dir = this.getPath(this.MODULE_DIR);        
        for (let name of FileHelper.readDirWithoutError(dir)) {
            let file = path.join(dir, name);
            let stat = fs.statSync(file);
            if (stat.isDirectory()) {
                await this.insertModule(name, file);
            }
        }
    }

    async insertModule (name, dir) {
        await PromiseHelper.setImmediate();
    }
};
module.exports.init();

const fs = require('fs');
const path = require('path');
const FileHelper = require('areto/helper/FileHelper');
const PromiseHelper = require('areto/helper/PromiseHelper');