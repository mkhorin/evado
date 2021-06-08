/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
Jam.Loadable = class Loadable extends Jam.Element {

    constructor ($container) {
        super($container);
        this.$container = $container;
        this.$toggle = this.find('.loadable-toggle');
        this.$toggle.click(this.onToggle.bind(this));
    }

    isLoading () {
        return this.hasClass('loading');
    }

    onToggle () {
        if (!this.isLoading()) {
            this.load();
        }
    }

    onAlways () {
        this.addClass('loaded');
    }

    onDone (data) {
        this.setContent(data);
    }

    onFail () {
        this.setContent('');
    }

    load () {
        this.abort();
        this.removeClass('loaded');
        this.addClass('loading');
        this.xhr = $[this.getMethod()](this.getUrl(), this.getRequestData())
            .always(this.onAlways.bind(this))
            .done(this.onDone.bind(this))
            .fail(this.onFail.bind(this));
    }

    abort () {
        this.xhr?.abort();
        this.removeClass('loading');
    }

    getMethod () {
        return this.getData('method') || 'get';
    }

    getUrl () {
        return this.getData('url');
    }

    getRequestData () {
        return {
            url: location.pathname,
            params: location.search,
            ...this.getData('params')
        };
    }

    findContent () {
        return this.find('.loadable-content');
    }

    setContent (data) {
        Jam.resource.resolve(data).then(result => {
            const $content = this.findContent();
            $content.html(result);
            Jam.t($content);
            Jam.createElements($content);
        });
    }
};