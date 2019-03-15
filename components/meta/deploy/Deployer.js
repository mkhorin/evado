'use strict';

const Base = require('areto/base/Component');

module.exports = class Deployer extends Base {

    constructor (config) {
        super({
            'excludes': [], // project names
            ...config
        });
    }

    getMeta () {
        return this.module.get('meta');
    }

    deploy (names) {
        return names instanceof Array
            ? this.deployProjectNames(names)
            : this.deployAll();
    }

    async deployProjectNames (names) {
        let dir = this.module.getProjectPath();
        for (let name of names) {
            let stat = fs.statSync(path.join(dir, name));
            stat.isDirectory()
                ? await this.deployProject(name)
                : this.logError(`Invalid project directory: ${name}`);
        }
    }

    deployAll () {
        let dir = this.module.getProjectPath();
        return FileHelper.handleChildren(dir, name => {
            if (this.excludes.includes(name)) {
                return this.log('warn', `Project is excluded: ${name}`);
            }
            let stat = fs.statSync(path.join(dir, name));
            return stat.isDirectory()
                ? this.deployProject(name)
                : PromiseHelper.setImmediate();
        });
    }

    deployProject (projectName) {
        return this.getMeta().processHandler(async ()=> {
            let dir = this.module.getProjectPath(projectName);
            let stat = fs.statSync(dir);
            if (!stat.isDirectory()) {
                return this.logError(`Invalid project dir: ${dir}`);
            }
            await this.getMeta().removeProject(projectName);
            await this.createDeploy({dir}).execute();
        });
    }

    deployClass (className, projectName) {
        let deploy = this.createDeploy({projectName});
        return this.getMeta().processHandler(async ()=> {
            await this.getMeta().removeClass(className, projectName);
            await deploy.insertClass(className);
        });
    }

    deployReport (reportName, projectName) {
        let deploy = this.createDeploy({projectName});
        return this.getMeta().processHandler(async ()=> {
            await this.getMeta().removeReport(reportName, projectName);
            await deploy.insertReport(reportName);
        });
    }

    deployNav (projectName) {
        let deploy = this.createDeploy({projectName});
        return this.getMeta().processHandler(async ()=> {
            await this.getMeta().removeNav(projectName);
            await deploy.insertNav();
            await deploy.insertModules();
        });
    }

    createDeploy (config) {
        return new Deploy({
            'deployer': this,
            'meta': this.getMeta(),
            'dir': config.dir || this.module.getProjectPath(config.projectName),
            ...config
        });
    }
};

const fs = require('fs');
const path = require('path');
const FileHelper = require('areto/helper/FileHelper');
const PromiseHelper = require('areto/helper/PromiseHelper');
const Deploy = require('./Deploy');