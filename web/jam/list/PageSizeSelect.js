/**
 * @copyright Copyright (c) 2022 Maxim Khorin <maksimovichu@gmail.com>
 */
Jam.PageSizeSelect = class PageSizeSelect {

    constructor (config, pagination) {
        this.events = new Jam.Events(this.constructor.name);
        this.pagination = pagination;
        this.$container = config.$pageSize;
        this.sizes = config.params.pageSizes;
        if (this.$container.length && Array.isArray(this.sizes)) {
            this.createSelect();
            this.$container.removeClass('hidden');
        }
    }

    createSelect () {
        const items = this.sizes.map(this.renderSize, this);
        this.$select = this.$container.find('select');
        this.$select.html(items.join(''));
        this.$select.val(this.pagination.pageSize);
        this.$select.change(this.onChange.bind(this));
    }

    getValue () {
        return Number(this.$select.val()) || 0;
    }

    onChange () {
        this.events.trigger('change', this.getValue());
        this.$select.blur();
    }

    renderSize (value) {
        return `<option value="${value}">${value}</option>`;
    }
};