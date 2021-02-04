/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
Jam.SetAttrValueBehavior = class SetAttrValueBehavior {

    constructor (params) {
        this.model = params.owner;
        this.params = params;
    }

    init () {
        this.source = this.model.getAttr(this.params.source);
        this.source.$value.change(this.onChangeSource.bind(this));
    }

    onChangeSource () {
        if (this.source.getValue() === this.params.sourceValue) {
            const target = this.model.getAttr(this.params.target);
            target.setValue(this.params.targetValue);
        }
    }
};