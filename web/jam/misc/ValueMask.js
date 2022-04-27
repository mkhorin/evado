/**
 * @copyright Copyright (c) 2022 Maxim Khorin <maksimovichu@gmail.com>
 */
Jam.ValueMask = class ValueMask {

    static isValid (data, params) {
        return Inputmask.isValid(String(data), params);
    }

    static format (data, params) {
        return Inputmask.format(String(data), params);
    }

    constructor (params, $input) {
        this.$input = $input;
        this.create(params);
    }

    isComplete () {
        return this.instance?.isComplete();
    }

    create (params) {
        this.remove();
        if (params) {
            this.instance = this.$input.inputmask(params).get(0).inputmask;
        }
        this.params = params;
    }

    remove () {
        this.instance?.remove();
        this.instance = null;
    }
};