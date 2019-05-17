'use strict';

module.exports = class MetaData {

    constructor () {
        this.node = null;        
        this.class = null;
        this.view = null;
        this.id = null;
        this.master = {            
            class: null,
            attr: null,
            id: null,
            model: null
        };
    }
};