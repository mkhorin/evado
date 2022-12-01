/**
 * @copyright Copyright (c) 2022 Maxim Khorin <maksimovichu@gmail.com>
 */
Jam.PageJumper = class PageJumper {

    constructor (config) {
        this.events = new Jam.Events(this.constructor.name);
        this.$input = config.$pageJumper;
        this.$input.on('keyup', this.onEnter.bind(this));
    }

    getValue () {
        return Number(this.$input.val()) - 1;
    }

    onEnter ({key}) {
        if (key === 'Enter') {
            this.events.trigger('change', this.getValue());
            this.$input.blur();
        }
        if (key === 'Escape') {
            this.$input.val('');
            this.$input.blur();
        }
    }

    update (page, numPages, hasHiddenPages) {
        const hidden = !this.$input.length || !hasHiddenPages;
        this.$input.toggleClass('hidden', hidden);
        this.$input.val('');
    }
};