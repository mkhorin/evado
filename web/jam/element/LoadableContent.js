/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

Jam.LoadableContent = class extends Jam.Element {

    constructor ($container) {
        super($container);
        this.$container = $container;
        this.$toggle = $container.find('.loadable-toggle');
        this.$toggle.click(this.onToggle.bind(this));
    }

    isLoading () {
        return this.$container.hasClass('loading');
    }

    onToggle () {
        if (!this.isLoading()) {
            this.load();
        }
    }

    onAlways () {
        this.$container.addClass('loaded');
    }

    onDone (data) {
        this.setContent(data);
    }

    onFail () {
        this.setContent('');
    }

    load () {
        this.abort();
        this.$container.removeClass('loaded').addClass('loading');
        this.xhr = $[this.getMethod()](this.getUrl(), this.getRequestData())
            .always(this.onAlways.bind(this))
            .done(this.onDone.bind(this))
            .fail(this.onFail.bind(this));
    }

    abort () {
        if (this.xhr) {
            this.xhr.abort();
        }
        this.$container.removeClass('loading');
    }

    getMethod () {
        return this.$container.data('method') || 'get';
    }

    getUrl () {
        return this.$container.data('url');
    }

    getRequestData () {
        return {
            url: location.pathname,
            params: location.search,
            ...this.$container.data('params')
        };
    }

    setContent (data) {
        this.$container.find('.loadable-content').html(data);
    }
};