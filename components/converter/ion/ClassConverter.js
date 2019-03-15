'use strict';

const Base = require('areto/base/Base');

module.exports = class ClassConverter extends Base {

    static processSemantic (data) {
        switch (data) {
            case 'chislennost': return '{chislennost}';
            case 'linkMunRaion': return '{linkMunRaion}';
            case 'name': return '{name}';
            case 'okato': return '{okato}';
            case 'standart': return '{standart}';
            case 'type': return '{type}';
            case 'vnutRaion| |ops': return '{vnutRaion} {ops}';
            case 'typeGraf| |typeTran| |trafficPattern': return '{typeGraf} {typeTran} {trafficPattern}';
            case 'name| (|numb|МГц)': return '{name} ({numb} МГц)';
            case 'nomer| |typeGraf| |typeTran': return '{nomer} {typeGraf} {typeTran}';
            case 'radio| |radioCanals': return '{radio} {radioCanals}';
            case 'operator| |type| |height': return '{operator} {type} {height}';
            case 'name| |adress| |tel': return '{name} {adress} {tel}';
            case 'fio| |pos| |tel| |fax| |email': return '{fio} {pos} {tel} {fax} {email}';
        }
        return null;
    }

    constructor (config) {
        super(config);
        this.name = this.source.name;
        this.data = {
            type: 'data'
        };
    }

    async process () {
        if (this.source.key instanceof Array) {
            this.data.key = this.source.key[0];
        }
        this.data.caption = this.source.caption;
        this.data.semantic = this.constructor.processSemantic(this.source.semantic);
        this.data.attrs = [];
        if (this.source.properties instanceof Array) {
            for (let source of this.source.properties) {
                await this.processProperty(source);
            }
        }
        return this.save();
    }

    async processProperty (source) {
        let prop = new PropConverter({
            source,
            classConverter: this
        });
        this.data.attrs.push(await prop.process());
    }

    save () {
        let dir = this.converter.getProjectPath('classes');
        mkdirp.sync(dir);
        fs.writeFileSync(path.join(dir, `${this.name}.json`), JSON.stringify(this.data, null, 4));
    }

    addBehavior (data) {
        ObjectHelper.push(data, 'behaviors', this.data);
    }
};
module.exports.init(module);

const fs = require('fs');
const mkdirp = require('mkdirp');
const path = require('path');
const ObjectHelper = require('areto/helper/ObjectHelper');
const PropConverter = require('./PropertyConverter');