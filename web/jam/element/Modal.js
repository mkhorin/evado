/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

Jam.Modal = class Modal extends Jam.Element {

    static getClosestBody ($element) {
        const $body = $element.closest('.jmodal-body');
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
        this.template = Jam.Helper.getTemplate('modal', $container);
        this.handlers = [];
        this.stackToggle = new Jam.ModalStackToggle(this);
        this.$pool.on('keyup', this.onKeyUp.bind(this));
    }

    init () {
        $('.modal-root-back').click(this.onBackFromRoot.bind(this));
        $(document.body).on('click', '.modal-link', this.onModalLink.bind(this));
        $(window).resize(this.onResize.bind(this));
    }

    isActiveLast () {
        const $active = this.$pool.children('.active');
        const $stacked = this.getStacked();
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

    isLast ($modal) {
        return this.getLast().$modal.get(0) === $modal.get(0);
    }

    getLast () {
        return this.getStacked().last().data('modal');
    }

    getStacked () {
        return this.$pool.children('.stacked');
    }

    create () {
        return new Jam.ModalItem(this);
    }

    createModal (item) {
        let $modal = this.$pool.children().not('.stacked').eq(0);
        if ($modal.length) {
            return $modal;
        }
        $modal = $(this.template);
        this.$pool.append($modal);
        $modal.on('click', '.jmodal-stack .close', event => item.close());
        $modal.click(event => {
            if (!$modal.hasClass('loading') && event.target === $modal.get(0)) {
                item.close();
            }
        });
        return $modal;
    }

    onLoad (fn) {
        this.handlers.push(fn);
    }

    afterLoad (item) {
        Jam.ContentNotice.clear();
        this.setActive(item);
        this.stackToggle.attach(item);
        for (const handler of this.handlers) {
            handler(item);
        }
        this.handlers = [];
        //this.stackToggle.$close.focus();
    }

    afterClose (item) {
        item.$modal.removeClass('stacked active');
        const $last = this.getStacked().last().addClass('active');
        $(document.body).toggleClass('jmodal-active', $last.length > 0);
        this.stackToggle.detach(item);
    }

    onResize () {
        this.$pool.children().each((index, element)=> $(element).data('modal').resize());
        this.stackToggle.resize();
    }

    onBackFromRoot () {
        $(document.body).removeClass('jmodal-root-active');
        this.setActive(this.getLast());
    }

    onModalLink (event) {
        event.preventDefault();
        const link = event.currentTarget;
        const url = link.getAttribute('href') || link.dataset.url;
        event.ctrlKey
            ? Jam.UrlHelper.openNewPageModal(url)
            : Jam.modal.create().load(url);
    }

    onKeyUp (event) {
        if (event.keyCode !== 27) {
            return true;
        }
        const item = this.getLast();
        if (item) {
            item.close();
        }
    }

    openFromUrl (url) {
        const target = Jam.UrlHelper.getUrlParams(url).modal;
        if (target) {
            this.create().load(decodeURIComponent(target));
        }   
    }    
};

Jam.ModalItem = class ModalItem {

    static resize (element) {
        const item = $(element).closest('.jmodal').data('item');
        if (item) {
            item.resize();
        }
    }

    constructor (modal) {
        this.modal = modal;
    }

    setActive () {
        this.$modal.addClass('active');
        if (!this.modal.isLast(this.$modal)) {
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
        this.xhr = $.get(url, params)
            .always(this.onAlways.bind(this))
            .done(data => this.onDone(data, initData))
            .fail(this.onFail.bind(this));
        return this.xhr; 
    }

    onAlways () {
        this.toggleLoading(false);
        this.loadedUrl = this.xhr.url;
        this.xhr = null;
    }

    onDone (content, initData) {
        this.initData = initData;
        Jam.resource.resolve(content, result => {
            this.$body.empty().append(result);
            const $container = this.$body.children().first();
            Jam.i18n.translateContainer($container);
            this.createTitle($container);
            this.createTabTitle($container);
            Jam.DateHelper.resolveClientDate(this.$body);
            Jam.createElements($container);
            this.resize();
            this.modal.afterLoad(this);
        });
    }

    createTitle ($container) {
        this.title = Jam.i18n.translate($container.data('title'), $container.data('t-title')) || '';
        const url = $container.data('url') || this.getLoadUrl();
        this.$title.html(`<a href="${Jam.UrlHelper.getNewPageUrl(url)}" target="_blank">${this.title}</a>`);
    }

    createTabTitle ($container) {
        this.tabTitle = $container.data('tab');
        this.tabTitle = this.tabTitle
            ? Jam.i18n.translate(this.tabTitle, $container.data('t-tab'))
            : this.title;
    }

    onFail (xhr) {
        this.$body.html(`<div class="jmodal-error"><pre>${xhr.responseText}</pre></div>`);
        this.title = Jam.i18n.translate(`${xhr.status} ${xhr.statusText}` || 'Error');
        this.tabTitle = this.title;
        const url = Jam.UrlHelper.getNewPageUrl(this.getLoadUrl());
        this.$title.html(`<a href="${url}" target="_blank"><span class="text-danger">${this.title}</span></a>`);
        this.resize();
        this.modal.afterLoad(this);
    }

    getLoadUrl () {
        return Jam.UrlHelper.addUrlParams(this.url, this.loadParams || '');
    }

    close (data) {
        if (!this.checkLastActive()) {
            return false;
        }
        const event = $.Event(this.getEventName('beforeClose'));
        this.$modal.triggerHandler(event, data);
        if (event.isPropagationStopped()) {
            return false;
        }
        data = event.data || data; // event.data can be set by listener
        event.deferred
            ? event.deferred.then(()=> this.forceClose(data))
            : this.forceClose(data);
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
            return this.load(this.url, this.loadParams, this.initData);
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
        Jam.dialog.alert('Close the last modal tab');
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
        const top = this.$container.offset().top - $(window).scrollTop();
        const maxHeight = $(window).height() - top - this.$header.outerHeight();
        this.$body.css('max-height', maxHeight);
        const $scroll = this.$body.children('.jmodal-scroll-container');
        if ($scroll.length) {
            const $header = $scroll.children('.scroll-header');
            $scroll.children('.scroll-body').css('max-height', maxHeight - $header.outerHeight());
        }
    }

    scrollTo ($target) {
        const $scroll = this.$body.children('.jmodal-scroll-container').children('.scroll-body');
        const top = $target.first().offset().top - $scroll.offset().top;
        $scroll.animate({scrollTop: $scroll.scrollTop() + top});
    }
};

Jam.ModalStackToggle = class ModalStackToggle {

    constructor (modal) {
        this.modal = modal;
        this.$stack = modal.$container.find('.jmodal-stack');
        this.$root = this.$stack.find('.root');
        this.$pool = this.$stack.find('.jmodal-stack-pool');
        this.template = Jam.Helper.getTemplate('stack', modal.$container);
        this.init();
    }

    init () {
        this.$pool.on('click','.jmodal-stack-toggle', event => {
            this.modal.setActive($(event.currentTarget).data('modal'));
        });
        this.$root.click(()=> this.modal.setActive(null));
    }

    getItem (modal) {
        return this.$pool.children().filter((index, element)=> $(element).data('modal') === modal);
    }

    attach (modal) {
        let $item = this.getItem(modal);
        if (!$item.length) {
            $item = $(Jam.Helper.resolveTemplate(this.template, {
                title: Jam.Helper.clearHtml(modal.title),
                text: modal.tabTitle
            }));
            $item.data('modal', modal);
            this.$pool.append($item);
        }
        this.resize();
    }

    detach () {
        this.$pool.children().last().remove();
        this.resize();
    }

    resize () {
        const modal = this.modal.getActive();
        if (!modal) {
            return false;
        }
        const $children = this.$pool.children();
        $children.filter('.active').removeClass('active');
        $children.filter((index, element)=> $(element).data('modal') === modal).addClass('active');
        modal.$modal.prepend(this.$stack);
        if (this.$stack.css('position') === 'fixed') {
            this.resolveMaxWidth(modal, $children);
        }
    }

    resolveMaxWidth (modal, $children) {
        const left = modal.$container.offset().left;
        this.$stack.offset({left});

        const poolWidth = modal.$container.width() - this.$root.outerWidth();
        this.$pool.width(poolWidth);

        //$children.css('width', 'auto'');
        $children.outerWidth('auto');
        let childWidth = 0;
        for (const child of $children) {
            childWidth += $(child).outerWidth();
        }
        const overflow = childWidth - poolWidth;
        if (overflow <= 0) {
            return;
        }
        for (const child of $children) {
            const $child = $(child);
            const width = $child.outerWidth();
            const delta = width * overflow / childWidth;
            $child.outerWidth(width - delta);
        }
    }
};