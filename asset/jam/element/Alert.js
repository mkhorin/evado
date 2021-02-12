/**
 * @copyright Copyright (c) 2021 Maxim Khorin <maksimovichu@gmail.com>
 */
Jam.Alert = class Alert {

    constructor (params) {
        this.params = {
            cssClasses: '',
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
        this.$element.find('.close').click(this.hide.bind(this));
        this.hide();
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
        if (typeof message === 'string') {
            this.build(type, Jam.t(message));
            this.$element.show();
            this.scrollTo();
        }
        return this;
    }

    build (type, message) {
        this.$element.removeClass().addClass(`${this.params.cssClasses} alert-${type} alert`);
        this.$element.find('.message').html(message);
    }

    scrollTo () {
        if (this.params.$scrollTo) {
            this.params.$scrollTo.animate({scrollTop: 0}, this.params.scrollSpeed);
        }
    }

    hide () {
        this.$element.hide();
        return this;
    }

    createElement () {
        return '<div class="alert"><button type="button" class="close">&times;</button><div class="message"></div></div>';
    }
};

Jam.MainAlert = class MainAlert extends Jam.Alert {

    static clear () {
        $('.main-alert').remove();
    }

    constructor (params) {
        super({
            cssClasses: 'main-alert',
            container: $('.main-container'),
            ...params
        });
    }
};