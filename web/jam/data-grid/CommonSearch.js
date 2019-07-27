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
        this.$advancedToggle = this.$container.find('.advanced-toggle');
        this.$advancedToggle.click(this.onToggleAdvancedSearch.bind(this));
        this.$input = this.$container.find('input');
        this.$input.keyup(this.onKeyUpInput.bind(this));
    }

    getValue () {
        return this._value;
    }

    onToggleAdvancedSearch () {
        this.grid.events.trigger('toggleAdvancedSearch');
    }

    onKeyUpInput (event) {
        if (event.keyCode === 27) {
            this.$input.val('');
        }
        let value = this.$input.val();
        if (value === '') {
            return this.execute(value);
        }
        if (event.keyCode === 13) {
            value = $.trim(value);
            this.$input.val(value);
            this.execute(value);
        }
    }

    execute (value) {
        if (value !== this._value) {
            this._value = value;
            this.grid.load({resetPage: true});
        }
    }
};