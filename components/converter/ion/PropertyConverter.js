'use strict';

const Base = require('areto/base/Base');

module.exports = class PropertyConverter extends Base {

    static getConstants () {
        return {
            /*TYPE_MAP: {
                0: 'string',
                1: 'string',
                2: 'string',
                3: 'string',
                4: 'file',
                5: 'file',
                6: 'integer',
                7: 'float',
                8: 'float',
                9: 'datetime',
                10: 'boolean',
                11: 'string',
                12: 'id',
                13: 'ref',
                COLLECTION: 14,
                SET: 15,
                STRUCT: 16,
                CUSTOM: 17,
                USER: 18,
                PERIOD: 60,
                GEO: 100,
                FILE_LIST: 110,
                SCHEDULE: 210
            }*/
        };
    }
/*
{value: 'backref', label: 'Back reference'},
    {value: 'boolean', label: 'Boolean'},
    {value: 'calc', label: 'Calc'},
    {value: 'datetime', label: 'Datetime'},
    {value: 'file', label: 'File'},
    {value: 'float', label: 'Float'},
    {value: 'id', label: 'ID'},
    {value: 'integer', label: 'Integer'},
    {value: 'ref', label: 'Reference'},
    {value: 'string', label: 'String'},
    {value: 'timestamp', label: 'Timestamp'
*/
    process () {
        this.data = {
            name: this.source.name,
            caption: this.source.caption,
            type: this.getType()
        };
        this.setRelation();
        this.setKey();
        this.setTimestamp();
        return this.data;
    }

    isKey () {
        return this.classConverter.data.key === this.data.name;
    }

    getType () {
        switch (this.source.type) {
            case 6: return 'integer';
            case 7: case 8: return 'float';
            case 13: case 14: return 'ref';
            case 9: return 'datetime';
            case 10: return 'boolean';
        }
        return 'string';
    }

    addBehavior (data) {
        if (!(this.data.behaviors instanceof Array)) {
            this.data.behaviors = [];
        }
        this.data.behaviors.push(data);
    }

    setRelation () {
        if (this.data.type !== 'ref') {
            return;
        }
        let rel = {
            'multiple': this.source.type === 14,
            'refClass': this.source.refClass || this.source.itemsClass
        };
        if (this.source.backRef) {
            this.data.type = 'backref';
            rel.refAttr = this.source.backRef;
        }
        this.data.relation = rel;
    }

    setKey () {
        if (this.isKey()) {
            this.data.indexing = 1;
            if (!this.data.relation) {
                this.addBehavior({type: 'guid'});
            }
        }
    }

    setTimestamp () {
        if (this.data.name.indexOf('dateModif') === 0 && this.data.type === 'datetime') {
            this.data.readOnly = true;
            this.classConverter.addBehavior({
                type: 'timestamp',
                createdAttr: this.data.name,
                updatedAttr: this.data.name
            });
        }
    }
};
module.exports.init();