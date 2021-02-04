/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
Jam.DataGridCommonSearch = class DataGridCommonSearch {

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
        this.$input.on('keyup', this.onKeyUp.bind(this));
        this.$input.on('input', this.onInput.bind(this));
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

    onKeyUp (event) {
        if (event.keyCode === 13 || event.keyCode === 27) {
            this.execute(this.$input.val());
        }
    }

    onInput (event) {
        const value = this.$input.val();
        value ? this.toggleHasValue(value) : this.execute(value);
    }

    execute (value) {
        if (value !== this._value) {
            this._value = value;
            this.toggleFiltered(value);
            this.grid.load({resetPage: true});
        }
        this.toggleHasValue(value);
    }

    toggleHasValue (value) {
        this.$container.toggleClass('has-value', value.length > 0);
    }

    toggleFiltered (value) {
        this.$container.toggleClass('filtered', value.length > 0);
    }
};