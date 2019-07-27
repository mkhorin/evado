/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

Jam.Modal = class extends Jam.Element {

    static getClosestBody ($element) {
        let $body = $element.closest('.jmodal-body');
        return $body.length ? $body : $(document.body);
    }

    static load (modal, url, params, afterClose) {
        modal = modal || Jam.modal.create();
        modal.load(url, params).done(()=> {
            modal.one('afterClose', (event, data)=> {
                if (data && data.reopen) {
                    this.load(modal, url, params, afterClose);
                }
                if (typeof afterClose === 'function') {
                    afterClose(data);
                }
            });
        });
        return modal;
    }

    constructor ($container) {
        super($container);
        Jam.modal = this;
        this.$container = $container;
        this.$pool = $container.find('.jmodal-pool');
        this.$sample = $container.find('.sample.jmodal');
        this.handlers = [];
        this.stackToggle = new Jam.Modal.StackToggle(this);
        $('.modal-root-back').click(this.onBackFromRoot.bind(this));
        $(document.body).on('click', '.modal-link', this.onModalLink.bind(this));
        $(window).resize(this.onResize.bind(this));
    }

    isActiveLast () {
        let $active = this.$pool.children('.active');
        let $stacked = this.$pool.children('.stacked');
        return $active.length
            ? $active.next('.stacked').length === 0
            : $stacked.length === 0;
    }

    getActive () {
        return this.$pool.children('.active').last().data('modal');
    }

    setActive (item) {
        this.$pool.children('.active').removeClass('active queued');
        if (!item) {
            return $(document.body).addClass('jmodal-root-active');
        }
        $(document.body).addClass('jmodal-active');
        item.setActive();
        this.stackToggle.resize();
    }

    isLastStacked ($modal) {
        return this.getLastStacked().$modal.get(0) === $modal.get(0);
    }

    getLastStacked () {
        return this.$pool.children('.stacked').last().data('modal');
    }

    create () {
        return new Jam.Modal.Item(this);
    }

    createModal (item) {
        let $modal = this.$pool.children().not('.stacked').eq(0);
        if ($modal.length === 0) {
            $modal = this.$sample.clone().removeClass('sample');
            this.$pool.append($modal);
            $modal.on('click', '.jmodal-close', ()=> item.close());
            $modal.click(event => { // click to modal overlay
                if (!$modal.hasClass('loading') && event.target === $modal.get(0)) {
                    item.close();
                }
            });
        }
        return $modal;
    }

    onLoad (fn) {
        this.handlers.push(fn);
    }

    afterLoad (item) {
        this.setActive(item);
        this.stackToggle.attach(item);
        for (let handler of this.handlers) {
            handler(item);
        }
        this.handlers = [];
        this.stackToggle.$close.focus();
    }

    afterClose (item) {
        item.$modal.removeClass('stacked active');
        let $last = this.$pool.children('.stacked').last().addClass('active');
        $(document.body).toggleClass('jmodal-active', $last.length > 0);
        this.stackToggle.detach(item);
    }

    onResize () {
        this.$pool.children().each((index, element)=> $(element).data('modal').resize());
        this.stackToggle.resize();
    }

    onBackFromRoot () {
        $(document.body).removeClass('jmodal-root-active');
        this.setActive(this.getLastStacked());
    }

    onModalLink (event) {
        event.preventDefault();
        Jam.modal.create().load(event.target.href || $(event.target).data('url'));
    }

    openFromUrl (url) {
        let target = Jam.UrlHelper.getUrlParams(url).modal;
        if (target) {
            this.create().load(decodeURIComponent(target));
        }   
    }    
};

Jam.Modal.Item = class {

    static resize (element) {
        let item = $(element).closest('.jmodal').data('item');
        item && item.resize();
    }

    constructor (modal) {
        this.modal = modal;
    }

    setActive () {
        this.$modal.addClass('active');
        if (!this.modal.isLastStacked(this.$modal)) {
            this.$modal.addClass('queued');
        }
    }

    isLoading () {
        return this.$modal.hasClass('loading');
    }

    toggleLoading (state) {
        this.$modal.toggleClass('loading', state);
    }

    getEventName (name) {
        return 'modal.' + name;
    }

    on (name, handler) {
        this.$modal.on(this.getEventName(name), handler);
    }

    one (name, handler) {
        this.$modal.one(this.getEventName(name), handler);
    }

    off (name, handler) {
        this.$modal.off(this.getEventName(name), handler);
    }

    onClose (handler) {
        this.on('beforeClose', handler);
        this.one('afterClose', ()=> this.off('beforeClose', handler));
    }

    load (url, params, initData) {
        if (!this.checkLastActive()) {
            return $.Deferred().reject();
        }
        this.ensure();
        this.abort();
        this.toggleLoading(true);
        this.$modal.addClass('stacked');
        this.$modal.toggleClass('reopen', this.$body.children().length > 0);
        this.url = url;
        this.loadParams = params;
        return this.xhr = $.get(url, params)
            .always(this.processAlways.bind(this))
            .done(data => this.processDone(data, initData))
            .fail(this.processFail.bind(this));
    }

    processAlways () {
        this.toggleLoading(false);
        this.loadedUrl = this.xhr.url;
        this.xhr = null;
    }

    processDone (data, initData) {
        this.initData = initData;
        this.$body.html(Jam.resource.resolve(data));
        const $container = this.$body.children().first();
        Jam.i18n.translateContainer($container);
        this.title = Jam.i18n.translate($container.data('title')) || '';
        this.tabTitle = $container.data('tabTitle');
        this.tabTitle = this.tabTitle ? Jam.i18n.translate(this.tabTitle) : this.title;
        this.tabTitle = Jam.Helper.clearHtml(this.tabTitle);
        let url = Jam.UrlHelper.getNewPageUrl($container.data('url') || this.getLoadUrl());
        this.$title.html(`<a href="${url}" title="${this.tabTitle}" target="_blank">${this.title}</a>`);
        Jam.DateHelper.resolveClientDate(this.$body);
        Jam.createElements($container);
        this.resize();
        this.modal.afterLoad(this);
    }

    processFail (xhr) {
        this.$body.html(`<div class="jmodal-error"><pre>${xhr.responseText}</pre></div>`);
        this.title = Jam.i18n.translate(`${xhr.status} ${xhr.statusText}` || 'Error');
        this.tabTitle = this.title;
        let url = Jam.UrlHelper.getNewPageUrl(this.getLoadUrl());
        this.$title.html(`<a href="${url}" target="_blank"><span class="text-danger">${this.title}</span></a>`);
        this.resize();
        this.modal.afterLoad(this);
    }

    getLoadUrl () {
        return Jam.UrlHelper.addUrlParams(this.url, this.loadParams || '');
    }

    close (data) {
        if (this.checkLastActive()) {
            let event = $.Event(this.getEventName('beforeClose'));
            this.$modal.triggerHandler(event, data);
            // if not one of the handlers stops the event, then close it
            if (!event.isPropagationStopped()) {
                // the event.data can be set by listener
                this.forceClose(event.data || data);
            }
        }
    }

    forceClose (data, reloading) {
        data = data || {};
        this.abort();
        if (!data.reopen) {
            this.$body.empty();
        }
        this.modal.afterClose(this, data);
        if (!reloading) {
            this.$modal.triggerHandler(this.getEventName('afterClose'), data);
        }
    }

    reload (data) {
        if (this.checkLastActive()) {
            this.forceClose(data, true);
            this.load(this.url, this.loadParams, this.initData);
        }
    }

    abort () {
        if (this.xhr) {
            this.xhr.abort();
            delete this.xhr;
        }
    }

    checkLastActive () {
        if (this.modal.isActiveLast(this.$modal)) {
            return true;
        }
        alert('Go to last modal tab');
        return false;
    }

    ensure () {
        if (!this.$modal) {
            this.$modal = this.modal.createModal(this);
            this.$container = this.$modal.children('.jmodal-container');
            this.$body = this.$container.children('.jmodal-body');
            this.$header = this.$container.children('.jmodal-header');
            this.$title = this.$header.children('.jmodal-title');
        }
        this.$modal.data('modal', this);
    }

    resize () {
        let top = this.$container.offset().top - $(window).scrollTop();
        let maxHeight = $(window).height() - top - this.$header.outerHeight();
        this.$body.css('max-height', maxHeight);
        let $scroll = this.$body.children('.jmodal-scroll-container');
        if ($scroll.length) {
            let $header = $scroll.children('.scroll-header');
            $scroll.children('.scroll-body').css('max-height', maxHeight - $header.outerHeight());
        }
    }

    scrollTo ($target) {
        let $scroll = this.$body.children('.jmodal-scroll-container').children('.scroll-body');
        let top = $target.first().offset().top - $scroll.offset().top;
        $scroll.animate({scrollTop: $scroll.scrollTop() + top});
    }
};

Jam.Modal.StackToggle = class {

    constructor (modal) {
        this.modal = modal;
        this.$stack = modal.$container.find('.jmodal-stack');
        this.$root = this.$stack.find('.root');
        this.$pool = this.$stack.find('.jmodal-stack-pool');
        this.$sample = this.$stack.find('.sample');
        this.$close = this.$stack.children('.jmodal-close');
        this.init();
    }

    init () {
        this.$pool.on('click','.jmodal-stack-toggle', event => {
            this.modal.setActive($(event.currentTarget).data('modal'));
        });
        this.$root.click(event => this.modal.setActive(null));
    }

    getItem (modal) {
        return this.$pool.children().filter((index, element)=> $(element).data('modal') === modal);
    }

    attach (modal) {
        let $item = this.getItem(modal);
        if (!$item.length) {
            $item = this.$sample.clone().removeClass('sample').data('modal', modal);
            this.$pool.append($item);
        }
        $item.find('.text').html(modal.tabTitle);
        $item.attr('title', modal.tabTitle);
        this.resize();
    }

    detach (modal) {
        this.$pool.children().last().remove();
        this.resize();
    }

    resize () {
        let modal = this.modal.getActive();
        if (!modal) {
            return false;
        }
        let $children = this.$pool.children();
        $children.filter('.active').removeClass('active');
        $children.filter((index, element)=> $(element).data('modal') === modal).addClass('active');
        modal.$modal.prepend(this.$stack);

        if (this.$stack.css('position') === 'fixed') {
            let left = modal.$container.offset().left;
            this.$stack.offset({left});
            let poolWidth = modal.$container.width() - this.$root.outerWidth();
            this.$pool.width(poolWidth);
            let maxItemWidth = parseInt(poolWidth / $children.length);
            $children.css('max-width', maxItemWidth);
            let reminder = poolWidth - maxItemWidth * $children.length;
            $children.last().css('max-width', maxItemWidth + reminder);
        }
    }
};