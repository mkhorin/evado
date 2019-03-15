'use strict';

const Base = require('areto/base/Component');

module.exports = class Converter extends Base {

    static getConstants () {
        return {
        };
    }

    constructor (config) {
        super(config);
        this.meta = this.module.get('meta');
        this.projectName = this.project;
        this.sourceDir = this.source;
        this.source = {};
        this.tableData = {};
    }

    async process () {
        await this.loadSourceFile('package.json', 'package');
        await this.loadSourceFile('deploy.json', 'deploy');
        await this.createProject();
        await this.processClasses();
    }

    loadSourceFile (file, name) {
        this.source[name] = fs.readFileSync(this.getSourcePath(file));
        return PromiseHelper.setImmediate();
    }

    createProject () {
        let data = {};
        data.caption = '';
        fs.writeFileSync(this.getProjectPath('project.json'), JSON.stringify(data, null, 4));
    }

    processClasses () {
        return FileHelper.handleChildren(this.getSourceClassPath(), file => {
            let index = file.indexOf('.class.json');
            file = file.substring(0, index);
            return index > 0 ? this.processClass(file) : null;
        });
    }

    async processClass (name) {
        let classFile = this.getSourceClassPath(`${name}.class.json`);
        await (new ClassConverter({
            'converter': this,
            'source': FileHelper.readJsonFile(classFile)
        })).process();
        await this.processViews(name);
    }

    async processViews (className) {        
        for (let file of FileHelper.readDirWithoutError(this.getSourceViewPath(className))) {
            await this.processView(file, className);
        }
    }

    processView (name, className) {
        return (new ViewConverter({
            'converter': this,
            'source': FileHelper.readJsonFile(this.getSourceViewPath(className, name))
        })).process();
    }

    processNav () {
    }

    // DATA

    async processData (name) {
        let sourceDir = this.getSourcePath('data');
        let targetDir = this.getProjectPath('data', name);
        await FileHelper.handleChildren(sourceDir, file => {
            return this.processDataFile(FileHelper.readJsonFile(path.join(sourceDir, file)));
        });
        mkdirp.sync(targetDir);
        await FileHelper.emptyDir(targetDir);
        for (let name of Object.keys(this.tableData)) {
            name = `${this.meta.dataTablePrefix}${this.projectName}_${name}.json`;
            fs.writeFileSync(path.join(targetDir, name), JSON.stringify(data, null, 4));
            this.log('info', `Write file: ${name}`);
        }
    }

    processDataFile (data) {
        data._class = data._class.split('@')[0];
        for (let key of Object.keys(data)) {
            if (typeof data[key] === 'string' && data[key].length === 24 && data[key][10] === 'T') {
                data[key] = {$date: data[key]};
            }
        }
        ObjectHelper.push(data, data._class, this.tableData);
        return PromiseHelper.setImmediate();
    }

    // PATH

    getProjectPath (...args) {
        return this.meta.getProjectPath.apply(this.meta, [this.projectName].concat(args));
    }

    getSourceClassPath (...args) {
        return this.getSourcePath.apply(this, ['meta'].concat(args));
    }

    getSourceViewPath (...args) {
        return this.getSourcePath.apply(this, ['views'].concat(args));
    }

    getSourcePath (...args) {
        return this.module.getPath.apply(this.module, [this.sourceDir].concat(args));
    }
};
module.exports.init(module);

const fs = require('fs');
const mkdirp = require('mkdirp');
const path = require('path');
const FileHelper = require('areto/helper/FileHelper');
const ObjectHelper = require('areto/helper/ObjectHelper');
const PromiseHelper = require('areto/helper/PromiseHelper');
const ClassConverter = require('./ClassConverter');
const ViewConverter = require('./ViewConverter');