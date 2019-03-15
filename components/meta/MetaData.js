'use strict';

module.exports = class MetaData {

    constructor () {
        this.node = null;
        this.project = null;
        this.class = null;
        this.view = null;
        this.id = null;
        this.master = {
            project: null,
            class: null,
            attr: null,
            id: null,
            model: null
        };
    }
};