/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

Jam.ModelValidation = class ModelValidation {

    constructor (model) {
        this.model = model;
        this.events = new Jam.Events('ModelValidation');
        this.init();
    }

    init () {

    }
};