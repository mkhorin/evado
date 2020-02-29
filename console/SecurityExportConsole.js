/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('./SecurityImportConsole');

module.exports = class SecurityExportConsole extends Base {

    async execute () {
        this.data = await this.getStore().loadData();
        this.assignmentRuleMap = IndexHelper.indexObjects(this.data.assignmentRules, this.getKey());
        this.childMap = IndexHelper.indexObjectArrays(this.data.links, 'parent', 'child');
        //this.userMap = await this.app.spawn('model/User').find().raw().indexById().all();

        const data = {
            rules: this.getRules(),
            assignmentRules: this.getAssignmentRules(),
            metaPermissions: this.getMetaItems(),
            permissions: this.getItems('permission'),
            roles: this.getItems('role'),
            //users: await this.getUsers(),
            //assignments: this.getAssignments()
        };
        this.deleteProperties(data.rules);
        this.deleteProperties(data.assignmentRules);
        this.deleteProperties(data.permissions, 'type');
        this.deleteProperties(data.roles, 'type');
        const file = this.getDataFile();
        await this.saveData(data, file);
        this.log('info', `Security exported to ${file}`);
    }

    async saveData (data, file) {
        await FileHelper.createDirectory(path.dirname(file));
        data = JSON.stringify(data, null, parseInt(this.params.space) || 2);
        return fs.promises.writeFile(file, data);
    }

    getItems (type) {
        const result = {};
        for (const item of Object.values(this.data.itemMap)) {
            if (item.type === type) {
                item.children = this.getItemChildren(item);
                item.assignmentRules = this.getItemAssignmentRuleNames(item);
                item.rule = this.getItemRuleName(item);
                result[item.name] = item;
            }
        }
        return result;
    }

    getItemChildren (item) {
        const children = this.childMap[item[this.key]];
        if (Array.isArray(children)) {
            const result = [];
            for (const id of children) {
                const child = this.data.itemMap[id];
                if (child) {
                    result.push(child.name);
                }
            }
            return result;
        }
    }

    getItemAssignmentRules (item) {
        const children = this.childMap[item[this.key]];
        if (Array.isArray(children)) {
            const result = [];
            for (const id of children) {
                const child = this.data.itemMap[id];
                if (child) {
                    result.push(child.name);
                }
            }
            return result;
        }
    }

    deleteProperties (data, ...names) {
        names = [this.key, 'name', ...names];
        for (const item of Object.values(data)) {
            ObjectHelper.deleteProperties(names, item);
            ObjectHelper.deleteEmptyProperties(item);
        }
    }

    getRules () {
        const result = {};
        for (const rule of Object.values(this.data.ruleMap)) {
            result[rule.name] = rule;
        }
        return result;
    }

    getAssignmentRules () {
        const result = {};
        for (const rule of this.data.assignmentRules) {
            result[rule.name] = rule;
        }
        return result;
    }

    getMetaItems () {
        const targetMap = IndexHelper.indexObjectArrays(this.data.metaTargets, 'item');
        const result = [];
        for (const item of this.data.metaItems) {
            const targets = this.getMetaItemTargets(item, targetMap);
            if (targets) {
                item.targets = targets;
                item.roles = item.roles.map(id => this.data.itemMap[id].name);
                item.rule = this.getItemRuleName(item);
                item.assignmentRules = this.getItemAssignmentRuleNames(item);
                delete item.targetType;
                delete item[this.key];
                result.push(item);
            }
        }
        return result;
    }

    getMetaItemTargets (item, targetMap) {
        const targets = targetMap[item[this.key]];
        if (!Array.isArray(targets)) {
             return [];
        }
        for (const target of targets) {
            delete target.item;
            delete target[this.key];
            ObjectHelper.deleteEmptyProperties(target);
        }
        return targets;
    }

    getItemRuleName (item) {
        const rule = this.data.ruleMap[item.rule];
        return rule ? rule.name : undefined;
    }

    getItemAssignmentRuleNames ({assignmentRules}) {
        const result = [];
        if (Array.isArray(assignmentRules)) {
            for (const id of assignmentRules) {
                const rule = this.assignmentRuleMap[id];
                if (rule) {
                    result.push(rule.name);
                }
            }
        }
        return result.length ? result : undefined;
    }

    getAssignments () {
        const result = {};
        for (const data of this.data.assignments) {
            const user = this.userMap[data.user];
            const item = this.data.itemMap[data.item];
            if (user && item) {
                if (Array.isArray(result[user.name])) {
                    result[user.name].push(item.name);
                } else {
                    result[user.name] = [item.name];
                }
            }
        }
        return result;
    }

    async getUsers () {
        const key = this.key;
        const password = this.app.spawn('security/UserPassword');
        const passwordMap = await password.find().orderById().raw().index('user').all();
        const result = [];
        for (const item of Object.values(this.userMap)) {
            const password = passwordMap[item[key]];
            item.passwordHash = password ? password.hash : undefined;
            delete item[key];
            delete item.authKey;
            result.push(item);
        }
        return result;
    }
};

const fs = require('fs');
const path = require('path');
const FileHelper = require('areto/helper/FileHelper');
const IndexHelper = require('areto/helper/IndexHelper');
const ObjectHelper = require('areto/helper/ObjectHelper');