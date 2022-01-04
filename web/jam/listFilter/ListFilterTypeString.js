/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
Jam.ListFilterTypeString = class ListFilterTypeString extends Jam.ListFilterType {

    constructor (params) {
        params.type = params.type || 'string';
        super(...arguments);
    }

    init () {
        super.init();
        this.getValueElement().keyup(this.onKeyUp.bind(this));
    }

    onKeyUp (event) {
        if (event.key === 'Enter' && this.getValue().length) {
            this.filter.onApply();
        }
    }
};