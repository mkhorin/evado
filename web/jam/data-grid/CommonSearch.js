/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

Jam.DataGridCommonSearch = class {

    constructor (grid) {
        this._value = '';
        this.grid = grid;
        this.$container = grid.$container.find('.data-grid-common-search');
        if (this.isExists())  {
            this.init();
        }
    }

    isExists () {
        return this.$container.length > 0;
    }

    init () {
        this.$clear = this.$container.find('.clear');
        this.$clear.click(this.onClear.bind(this));
        this.$advancedToggle = this.$container.find('.advanced-toggle');
        this.$advancedToggle.click(this.onToggleAdvancedSearch.bind(this));
        this.$input = this.$container.find('input');
        this.$input.keyup(this.onKeyUpInput.bind(this));
    }

    getValue () {
        return this._value;
    }

    onClear () {
        this.$input.val('');
        this.execute('');
    }

    onToggleAdvancedSearch () {
        this.grid.events.trigger('toggleAdvancedSearch');
    }

    onKeyUpInput (event) {
        let value = this.$input.val();
        if (value === '') {
            this.execute(value);
        } else if (event.keyCode === 13) {
            value = $.trim(value);
            this.$input.val(value);
            this.execute(value);
        } else {
            this.toggleHasValue(value);
        }
    }

    execute (value) {
        if (value !== this._value) {
            this._value = value;
            this.grid.load({resetPage: true});
        }
        this.toggleHasValue(value);
    }

    toggleHasValue (value) {
        this.$container.toggleClass('has-value', value.length > 0);
    }
};