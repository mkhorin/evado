/**
 * @copyright Copyright (c) 2021 Maxim Khorin <maksimovichu@gmail.com>
 */
Jam.Alert = class Alert {

    constructor (params) {
        this.params = {
            css: '',
            scrollable: null, // scrollable container
            scrollSpeed: 'fast',
            ...params
        };
        this.init();
    }

    init () {
        this.$element = $(this.createElement());
        const container = this.params.container;
        if (typeof container === 'function') {
            container(this.$element);
        } else if (container) {
            container.prepend(this.$element);
        }
        this.$element.on('click', '.btn-close', this.hide.bind(this));
        this.hide();
    }

    hasElement (element) {
        return this.$element.is(element)
            || this.$element.find(element).length > 0;
    }

    success (message) {
        this.show('success', message);
    }

    info (message) {
        this.show('info', message);
    }

    warning (message) {
        this.show('warning', message);
    }

    danger (message) {
        this.show('danger', message);
    }

    show (type, message) {
        message = Jam.t(message);
        if (typeof message === 'string' && message) {
            this.build(type, message);
            this.$element.show();
            this.scrollTo();
        }
        return this;
    }

    build (type, message) {
        const classes = `${this.params.css} alert-${type} alert`;
        this.$element.removeClass().addClass(classes);
        this.$element.find('.message').html(message);
    }

    scrollTo () {
        const {scrollable, scrollSpeed} = this.params;
        if (scrollable) {
            Jam.ScrollHelper.scrollTo(this.$element, scrollable, scrollSpeed);
        }
    }

    hide () {
        this.$element.hide();
        return this;
    }

    createElement () {
        return '<div class="alert"><button type="button" class="btn-close"></button><div class="message"></div></div>';
    }
};