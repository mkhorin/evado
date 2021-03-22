/**
 * @copyright Copyright (c) 2021 Maxim Khorin <maksimovichu@gmail.com>
 */
Jam.StackFrame = class StackFrame {

    constructor (stack) {
        this.stack = stack;
    }

    setActive () {
        this.$frame.addClass('active');
    }

    isLoading () {
        return this.$frame.hasClass('loading');
    }

    toggleLoading (state) {
        this.$frame.toggleClass('loading', state);
    }

    getEventName (name) {
        return 'frame.' + name;
    }

    on (name, handler) {
        this.$frame.on(this.getEventName(name), handler);
    }

    one (name, handler) {
        this.$frame.one(this.getEventName(name), handler);
    }

    off (name, handler) {
        this.$frame.off(this.getEventName(name), handler);
    }

    trigger (name, data) {
        this.$frame.triggerHandler(this.getEventName(name), data);
    }

    onClose (handler) {
        this.on('beforeClose', handler);
        this.one('afterClose', () => this.off('beforeClose', handler));
    }

    load (url, params, initData) {
        if (!this.checkLastActive()) {
            return $.Deferred().reject();
        }
        this.ensure();
        this.abort();
        this.toggleLoading(true);
        this.$frame.addClass('tabbed');
        this.$frame.toggleClass('reopen', this.$body.children().length > 0);
        this.url = url;
        this.loadParams = params;
        this.xhr = $.get(url, params)
            .always(this.onAlways.bind(this))
            .done(data => this.onDone(data, initData))
            .fail(this.onFail.bind(this));
        this.result = $.Deferred();
        return this.result;
    }

    onAlways () {
        this.toggleLoading(false);
        this.loadedUrl = this.xhr.url;
        this.xhr = null;
    }

    onDone (content, initData) {
        this.initData = initData;
        Jam.resource.resolve(content).then(result => {
            this.$body.empty().append(result);
            const $container = this.$body.children().first();
            Jam.t(this.$body);
            this.createTitle($container);
            this.createTabTitle($container);
            Jam.DateHelper.resolveClientDate(this.$body);
            Jam.createElements($container);
            this.resize();
            this.stack.afterLoad(this);
            this.updateCsrfToken();
            this.result.resolve();
        });
    }

    updateCsrfToken () {
        for (const holder of this.$body.find('[data-csrf]')) {
            $(document.body).data('csrf', holder.dataset.csrf);
        }
    }

    createTitle ($container) {
        this.title = Jam.t($container.data('title'), $container.data('t-title'));
        this.title = Jam.escape(this.title);
        const url = $container.data('url') || this.getLoadUrl();
        this.$title.html(`<a href="${Jam.UrlHelper.getPageFrameUrl(url)}" target="_blank">${this.title}</a>`);
    }

    createTabTitle ($container) {
        this.tabTitle = $container.data('tab');
        this.tabTitle = this.tabTitle
            ? Jam.escape(Jam.t(this.tabTitle, $container.data('t-tab')))
            : this.title;
    }

    onFail (data) {
        this.$body.html(`<div class="stack-frame-error"><pre>${data.responseText}</pre></div>`);
        this.title = Jam.t(data.statusText || 'Error');
        this.tabTitle = data.status;
        const url = Jam.UrlHelper.getPageFrameUrl(this.getLoadUrl());
        this.$title.html(`<a href="${url}" target="_blank"><span class="text-danger">${this.title}</span></a>`);
        this.resize();
        this.stack.afterLoad(this);
        this.result.reject(data);
    }

    getLoadUrl () {
        return this.loadParams 
            ? Jam.UrlHelper.addParams(this.url, this.loadParams) 
            : this.url;
    }

    close (data) {
        if (!this.checkLastActive() || this.isLoading()) {
            return false;
        }
        const event = $.Event(this.getEventName('beforeClose'));
        this.$frame.triggerHandler(event, data);
        if (event.isPropagationStopped()) {
            return false;
        }
        // event.data can be set by listener handler
        data = event.data || data;
        return $.when(event.deferred).then(() => this.forceClose(data));
    }

    forceClose (data) {
        data = data || {};
        this.abort();
        if (!data.reopen) {
            this.$body.empty();
        }
        this.stack.afterClose(this, data);
        this.trigger('afterClose', data);
    }

    reload (data) {
        if (!this.checkLastActive()) {
            return $.Deferred().reject();
        }
        this.forceClose({reload: true, ...data});
        return this.load(this.url, this.loadParams, this.initData);
    }

    abort () {
        this.xhr?.abort();
        delete this.xhr;
    }

    checkLastActive () {
        if (this.stack.isActiveLast(this.$frame)) {
            return true;
        }
        Jam.dialog.alert('Close the last stack frame first');
    }

    find () {
        return this.$container.find(...arguments);
    }

    findInstanceByClass (instanceClass) {
        return Jam.Element.findInstanceByClass(instanceClass, this.$container);
    }

    findScroll () {
        return this.$body.children('.scroll-container');
    }

    findScrollHeader () {
        return this.findScroll().children('.scroll-header');
    }

    findScrollBody () {
        return this.findScroll().children('.scroll-body');
    }

    ensure () {
        if (!this.$frame) {
            this.$frame = this.stack.buildFrame(this);
            this.$container = this.$frame.children('.stack-frame-container');
            this.$body = this.$container.children('.stack-frame-body');
            this.$header = this.$container.children('.stack-frame-header');
            this.$title = this.$header.children('.stack-frame-title');
        }
        this.$frame.data('frame', this);
    }

    resize () {
        const top = this.$container.offset().top - $(window).scrollTop();
        const maxHeight = $(window).height() - top - this.$header.outerHeight();
        this.$body.css('max-height', maxHeight);
        if (this.findScroll().length) {
            const headerHeight = this.findScrollHeader().outerHeight();
            this.findScrollBody().css('max-height', maxHeight - headerHeight);
        }
    }

    scrollTo ($target) {
        const $scroll = this.findScrollBody();
        const top = $target.first().offset().top - $scroll.offset().top;
        const scrollTop = $scroll.scrollTop() + top;
        $scroll.animate({scrollTop});
    }
};