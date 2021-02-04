/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
Jam.ModelValidation = class ModelValidation {

    constructor (model) {
        this.model = model;
        this.events = new Jam.Events(this.constructor.name);
        this.init();
    }

    init () {

    }
};