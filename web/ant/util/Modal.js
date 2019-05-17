'use strict';

Ant.Modal = class {

    constructor ($container) {
        this.handlers = [];
        this.$container = $container;
        this.$pool = $container.find('.ant-modal-pool');
        this.$sample = $container.find('.sample.ant-modal');
        this.stackToggle = new Ant.Modal.StackToggle(this);
        this.$rootBack = $('#ant-modal-root-back');
        this.$rootBack.click(this.backFromRoot.bind(this));
        $(window).resize(this.resize.bind(this));
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
            return $(document.body).addClass('ant-modal-root-active');
        }
        $(document.body).addClass('ant-modal-active');
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
        return new Ant.Modal.Item(this);
    }

    createModal (item) {
        let $modal = this.$pool.children().not('.stacked').eq(0);
        if ($modal.length === 0) {
            $modal = this.$sample.clone().removeClass('sample');
            this.$pool.append($modal);
            $modal.on('click', '.ant-modal-close', ()=> item.close());
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

    afterLoad (item, cb) {
        this.setActive(item);
        this.stackToggle.attach(item);
        for (let handler of this.handlers) {
            handler(item);
        }
        this.handlers = [];
        cb && cb();
    }

    afterClose (item) {
        item.$modal.removeClass('stacked active');
        let $last = this.$pool.children('.stacked').last().addClass('active');
        $(document.body).toggleClass('ant-modal-active', $last.length > 0);
        this.stackToggle.detach(item);
    }

    resize () {
        this.$pool.children().each((index, element)=> $(element).data('modal').resize());
        this.stackToggle.resize();
    }

    backFromRoot () {
        $(document.body).removeClass('ant-modal-root-active');
        this.setActive(this.getLastStacked());
    }
};

Ant.Modal.Item = class {

    static resize (element) {
        let item = $(element).closest('.ant-modal').data('item');
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

    load (url, params, cb, initData) {
        if (!this.checkLastActive()) {
            return this.xhr;
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
            .done(data => this.processDone(data, cb, initData))
            .fail(this.processFail.bind(this));
    }

    processAlways () {
        this.toggleLoading(false);
        this.loadedUrl = this.xhr.url;
        this.xhr = null;
    }

    processDone (data, cb, initData) {
        this.initData = initData;
        this.$body.html(Ant.resource.resolve(data));
        let $container = this.$body.children().first();
        Ant.I18n.translateContainer($container);
        this.title = Ant.I18n.translate($container.data('title')) || '';
        this.tabTitle = $container.data('tabTitle');
        this.tabTitle = this.tabTitle ? Ant.I18n.translate(this.tabTitle) : this.title;
        let url = Ant.UrlHelper.getNewPageUrl($container.data('url') || this.getLoadUrl());
        this.$title.html(`<a href="${url}" title="${this.title}" target="_blank">${this.title}</a>`);
        Ant.DateHelper.resolveClientDate(this.$body);
        this.resize();
        this.modal.afterLoad(this, cb);
    }

    processFail (xhr) {
        this.$body.html(`<div class="ant-modal-error"><pre>${xhr.responseText}</pre></div>`);
        this.title = Ant.I18n.translate(`${xhr.status} ${xhr.statusText}` || 'Error');
        this.tabTitle = this.title;
        let url = Ant.UrlHelper.getNewPageUrl(this.getLoadUrl());
        this.$title.html(`<a href="${url}" target="_blank"><span class="text-danger">${this.title}</span></a>`);
        this.resize();
        this.modal.afterLoad(this);
    }

    getLoadUrl () {
        return Ant.UrlHelper.addUrlParams(this.url, this.loadParams || '');
    }

    close (data) {
        if (this.checkLastActive()) {
            let event = $.Event(this.getEventName('beforeClose'));
            this.$modal.triggerHandler(event, data);
            // если не один из обработчиков не остановит событие, то закрываем
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
            this.load(this.url, this.loadParams, null, this.initData);
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
        alert('Go to the last of the modal stack');
        return false;
    }

    ensure () {
        if (!this.$modal) {
            this.$modal = this.modal.createModal(this);
            this.$container = this.$modal.children('.ant-modal-container');
            this.$body = this.$container.children('.ant-modal-body');
            this.$header = this.$container.children('.ant-modal-header');
            this.$title = this.$header.children('.ant-modal-title');
        }
        this.$modal.data('modal', this);
    }

    resize () {
        let top = this.$container.offset().top - $(window).scrollTop();
        let maxHeight = $(window).height() - top - this.$header.outerHeight();
        this.$body.css('max-height', maxHeight);
        let $scroll = this.$body.children('.ant-modal-scroll-container');
        if ($scroll.length) {
            let $header = $scroll.children('.scroll-header');
            $scroll.children('.scroll-body').css('max-height', maxHeight - $header.outerHeight());
        }
    }

    scrollTo ($target) {
        let $scroll = this.$body.children('.ant-modal-scroll-container').children('.scroll-body');
        let top = $target.first().offset().top - $scroll.offset().top;
        $scroll.animate({scrollTop: $scroll.scrollTop() + top});
    }
};

Ant.Modal.StackToggle = class {

    constructor (modal) {
        this.modal = modal;
        this.$stack = modal.$container.find('.ant-modal-stack');
        this.$root = this.$stack.find('.root');
        this.$pool = this.$stack.find('.ant-modal-stack-pool');
        this.$sample = this.$stack.find('.sample');
        this.init();
    }

    init () {
        this.$pool.on('click','.ant-modal-stack-toggle', event => {
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
        $children.filter((index, element) => {
            return $(element).data('modal') === modal;
        }).addClass('active');
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