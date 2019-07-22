/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

Jam.Notice = class {

    constructor (params) {
        this.params = {
            cssClasses: 'default-notice light',
            scrollSpeed: 'fast',
            template: '#notice-template',
            ...params
        };
        this.init();
    }

    init () {
        this.$notice = $($(this.params.template).html());
        let container = this.params.container;
        if (typeof container === 'function') {
            container(this.$notice);
        } else if (container) {
            container.prepend(this.$notice);
        }
        this.$notice.find('.close').click(this.hide.bind(this));
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
            this.build(type, Jam.i18n.translate(message));
            this.$notice.removeClass('hidden');
            this.scrollTo();
        }
        return this;
    }

    build (type, message) {
        this.$notice.removeClass().addClass(`${this.params.cssClasses} notice notice-${type}`);
        this.$notice.find('.message').html(message);
    }

    scrollTo () {
        if (this.params.$scrollTo) {
            this.params.$scrollTo.animate({scrollTop: 0}, this.params.scrollSpeed);
        }
    }

    hide () {
        this.$notice.addClass('hidden');
        return this;
    }
};

Jam.ContentNotice = class extends Jam.Notice {

    static clear (container) {
        (container || $('#content')).find('.content-notice').remove();
    }

    constructor (params) {
        super({
            cssClasses: 'content-notice light',
            container: $('#content'),
            ...params
        });
    }
};