/**
 * @copyright Copyright (c) 2021 Maxim Khorin <maksimovichu@gmail.com>
 */
Jam.NavSearch = class NavSearch extends Jam.Element {

    init () {
        this.$input = this.find('input');
        this.$input.on('keyup', this.onKeyUp.bind(this));
        this.$input.on('input', this.onInput.bind(this));
    }

    onKeyUp ({key}) {
        if (key === 'Enter' || key === 'Escape') {
            this.execute();
        }
    }

    onInput () {
        const value = this.$input.val();
        value ? this.toggleHasValue(value) : this.execute();
    }

    execute () {
        const value = this.$input.val().toLowerCase();
        if (value !== this.value) {
            this.value = value;
            if (value.length > 1) {
                this.load();
            }
            this.toggleHasValue(value);
        }
    }

    toggleHasValue (value) {
        const hasValue = value.length > 0;
        if (!hasValue) {
            this.removeClass('found');
        }
        this.toggleClass('has-value', hasValue);
        this.removeClass('not-found');
    }

    load () {
        if (!this.hasClass('loading')) {
            this.addClass('loading');
            const url = this.getData('url');
            const search = this.value;
            $.post(url, {search}).done(this.onLoad.bind(this));
        }
    }

    onLoad (data) {
        this.removeClass('loading');
        const $result = this.find('.nav-search-result').html(data);
        if ($result.children().length) {
            return this.addClass('found');
        }
        this.removeClass('found');
        this.addClass('not-found');
    }
};