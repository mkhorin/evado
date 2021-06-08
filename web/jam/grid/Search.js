/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
Jam.DataGridSearch = class DataGridSearch {

    constructor (grid) {
        this.value = '';
        this.grid = grid;
        this.$container = grid.$container.find('.data-grid-search');
        if (this.isExists())  {
            this.init();
        }
    }

    isExists () {
        return this.$container.length > 0;
    }

    init () {
        this.$advancedToggle = this.$container.find('.advanced-toggle');
        this.$advancedToggle.click(this.onToggleAdvancedSearch.bind(this));
        this.$input = this.$container.find('input');
        this.$input.on('keyup', this.onKeyUp.bind(this));
        this.$input.on('input', this.onInput.bind(this));
    }

    getValue () {
        return this.value;
    }

    onToggleAdvancedSearch () {
        this.grid.events.trigger('toggleAdvancedSearch');
    }

    onKeyUp ({key}) {
        if (key === 'Enter' || key === 'Escape') {
            this.execute(this.$input.val());
        }
    }

    onInput () {
        const value = this.$input.val();
        value ? this.toggleHasValue(value) : this.execute(value);
    }

    execute (value) {
        if (value !== this.value) {
            this.value = value;
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