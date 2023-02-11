/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('./SecurityImportConsole');

module.exports = class SecurityExportConsole extends Base {

    getDefaultParams () {
        return Object.assign(super.getDefaultParams(), {
            space: 2
        });
    }

    async execute () {
        this.data = await this.getStore().loadData();
        const key = this.getKey();
        this.assignmentRuleMap = IndexHelper.indexObjects(this.data.assignmentRules, key);
        this.childMap = IndexHelper.indexObjectArrays(this.data.links, 'parent', 'child');
        const data = {
            rules: this.getRules(),
            assignmentRules: this.getAssignmentRules(),
            metaPermissions: this.getMetaItems(),
            permissions: this.getItems('permission'),
            roles: this.getItems('role')
        };
        if (this.params.users) {
            const query = this.spawnUser().createQuery().indexByKey().raw();
            this.userMap = await query.all();
            data.users = await this.getUsers();
            data.assignments = this.getAssignments();
        }
        this.deleteUnnecessaryProperties(data.rules);
        this.deleteUnnecessaryProperties(data.assignmentRules);
        this.deleteUnnecessaryProperties(data.permissions, 'type');
        this.deleteUnnecessaryProperties(data.roles, 'type');
        const file = this.getDataFile();
        await this.saveData(data, file);
        this.log('info', `Security exported to ${file}`);
    }

    async saveData (data, file) {
        const dir = path.dirname(file);
        await FileHelper.createDirectory(dir);
        data = JSON.stringify(data, null, parseInt(this.params.space));
        await fs.promises.writeFile(file, data);
    }

    getItems (type) {
        const result = {};
        for (const item of Object.values(this.data.itemMap)) {
            if (item.type === type) {
                item.children = this.getItemChildren(item);
                item.assignmentRules = this.getItemAssignmentRuleNames(item);
                item.rules = this.getItemRuleNames(item);
                result[item.name] = item;
            }
        }
        return result;
    }

    getItemChildren (item) {
        const children = this.childMap[item[this.getKey()]];
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

    deleteUnnecessaryProperties (data, ...names) {
        names = [this.getKey(), 'name', ...names];
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
        const key = this.getKey();
        const targetMap = IndexHelper.indexObjectArrays(this.data.metaTargets, 'item');
        const result = [];
        for (const item of this.data.metaItems) {
            const targets = this.getMetaItemTargets(item, targetMap);
            if (targets) {
                item.targets = targets;
                item.roles = item.roles.map(id => this.data.itemMap[id].name);
                item.rules = this.getItemRuleNames(item);
                item.assignmentRules = this.getItemAssignmentRuleNames(item);
                delete item.targetType;
                delete item[key];
                result.push(item);
            }
        }
        return result;
    }

    getMetaItemTargets (item, targetMap) {
        const key = this.getKey();
        const targets = targetMap[item[key]];
        if (!Array.isArray(targets)) {
             return [];
        }
        for (const target of targets) {
            delete target.item;
            delete target[key];
            ObjectHelper.deleteEmptyProperties(target);
        }
        return targets;
    }

    getItemRuleNames (item) {
        if (!Array.isArray(item.rules)) {
            return;
        }
        const names = [];
        for (const id of item.rules) {
            const rule = this.data.ruleMap[id];
            if (rule) {
                names.push(rule.name);
            }
        }
        if (names.length) {
            return names;
        }
    }

    getItemAssignmentRuleNames ({assignmentRules}) {
        if (!Array.isArray(assignmentRules)) {
            return;
        }
        const names = [];
        for (const id of assignmentRules) {
            const rule = this.assignmentRuleMap[id];
            if (rule) {
                names.push(rule.name);
            }
        }
        if (names.length) {
            return names;
        }
    }

    getAssignments () {
        const result = {};
        for (const data of this.data.assignments) {
            const user = this.userMap[data.user];
            const item = this.data.itemMap[data.item];
            if (user && item) {
                ObjectHelper.push(item.name, user.name, result);
            }
        }
        return result;
    }

    async getUsers () {
        const key = this.getKey();
        const password = this.spawn('security/UserPassword');
        const query = password.createQuery().orderByKey().raw().index('user');
        const passwordMap = await query.all();
        const result = [];
        for (const item of Object.values(this.userMap)) {
            const password = passwordMap[item[key]];
            item.passwordHash = password ? password.hash : undefined;
            delete item.authKey;
            delete item.createdAt;
            delete item.updatedAt;
            result.push(item);
        }
        return result;
    }
};

const FileHelper = require('areto/helper/FileHelper');
const IndexHelper = require('areto/helper/IndexHelper');
const ObjectHelper = require('areto/helper/ObjectHelper');
const fs = require('fs');
const path = require('path');