/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

Jam.ModalStack = class ModalStack extends Jam.Element {

    static getClosestBody ($element) {
        const $body = $element.closest('.jmodal-body');
        return $body.length ? $body : $(document.body);
    }

    static load (modal, url, params, afterClose) {
        return modal.load(url, params).done(() => {
            modal.one('afterClose', (event, data) => {
                if (data && data.reopen) {
                    this.load(modal, url, params, afterClose);
                }
                if (typeof afterClose === 'function') {
                    afterClose(data);
                }
            });
        });
    }

    constructor ($container) {
        super($container);
        Jam.modalStack = this;
        this.$container = $container;
        this.$pool = $container.find('.jmodal-pool');
        this.template = Jam.Helper.getTemplate('modal', $container);
        this.handlers = [];
        this.stackToggle = new Jam.ModalStackToggle(this);
        $(document.body).on('keyup', this.onKeyUp.bind(this));
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

    setActive (frame) {
        this.$pool.children('.active').removeClass('active queued');
        if (!frame) {
            return $(document.body).addClass('jmodal-root-active');
        }
        $(document.body).addClass('jmodal-active');
        frame.setActive();
        this.stackToggle.resize();
    }

    isLast ($frame) {
        return this.getLast().$frame.get(0) === $frame.get(0);
    }

    getLast () {
        return this.getStacked().last().data('modal');
    }

    getFrame ($element) {
        return $element.closest('.jmodal').data('modal');
    }

    getStacked () {
        return this.$pool.children('.stacked');
    }

    createFrame () {
        return new Jam.ModalFrame(this);
    }

    buildFrame (frame) {
        let $frame = this.$pool.children().not('.stacked').eq(0);
        if ($frame.length) {
            return $frame;
        }
        $frame = $(this.template);
        this.$pool.append($frame);
        $frame.on('click', '.jmodal-stack .close', () => frame.close());
        $frame.click(event => {
            if (event.target === event.currentTarget) {
                frame.close();
            }
        });
        return $frame;
    }

    onLoad (fn) {
        this.handlers.push(fn);
    }

    afterLoad (frame) {
        Jam.ContentNotice.clear();
        this.setActive(frame);
        this.stackToggle.attach(frame);
        for (const handler of this.handlers) {
            handler(frame);
        }
        this.handlers = [];
        frame.trigger('afterLoad');
        //this.stackToggle.$close.focus();
    }

    afterClose (frame) {
        frame.$frame.removeClass('stacked active');
        const $last = this.getStacked().last().addClass('active');
        $(document.body).toggleClass('jmodal-active', $last.length > 0);
        this.stackToggle.detach(frame);
    }

    onResize () {
        this.$pool.children().each((index, element) => $(element).data('modal').resize());
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
        if (event.ctrlKey || link.getAttribute('target') === '_blank') {
            Jam.UrlHelper.openNewPageModal(url, link.dataset.base);
        } else {
            Jam.dialog.close();
            this.constructor.load(Jam.modalStack.createFrame(), url);
        }
    }

    onKeyUp (event) {
        if (event.keyCode === 27) {
            this.closeLastFrame();
        }
    }

    closeLastFrame () {
        const frame = this.getLast();
        if (frame) {
            frame.close();
        }
    }

    openFromUrl (url) {
        const {modal} = Jam.UrlHelper.getParams(url);
        if (modal) {
            this.createFrame().load(modal);
        }   
    }    
};

Jam.ModalFrame = class ModalFrame {

    constructor (stack) {
        this.stack = stack;
    }

    setActive () {
        this.$frame.addClass('active');
        if (!this.stack.isLast(this.$frame)) {
            this.$frame.addClass('queued');
        }
    }

    isLoading () {
        return this.$frame.hasClass('loading');
    }

    toggleLoading (state) {
        this.$frame.toggleClass('loading', state);
    }

    getEventName (name) {
        return 'modal.' + name;
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
        this.$frame.addClass('stacked');
        this.$frame.toggleClass('reopen', this.$body.children().length > 0);
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
            Jam.i18n.translateContainer(this.$body);
            this.createTitle($container);
            this.createTabTitle($container);
            Jam.DateHelper.resolveClientDate(this.$body);
            Jam.createElements($container);
            this.resize();
            this.stack.afterLoad(this);
            this.updateCsrfToken();
        });
    }

    updateCsrfToken () {
        for (const holder of this.$body.find('[data-csrf]')) {
            $(document.body).data('csrf', holder.dataset.csrf);
        }
    }

    createTitle ($container) {
        this.title = Jam.i18n.translate($container.data('title'), $container.data('t-title'));
        this.title = Jam.Helper.escapeTags(this.title);
        const url = $container.data('url') || this.getLoadUrl();
        this.$title.html(`<a href="${Jam.UrlHelper.getPageModalUrl(url)}" target="_blank">${this.title}</a>`);
    }

    createTabTitle ($container) {
        this.tabTitle = $container.data('tab');
        this.tabTitle = this.tabTitle
            ? Jam.Helper.escapeTags(Jam.i18n.translate(this.tabTitle, $container.data('t-tab')))
            : this.title;
    }

    onFail (data) {
        this.$body.html(`<div class="jmodal-error"><pre>${data.responseText}</pre></div>`);
        this.title = Jam.i18n.translate(`${data.status} ${data.statusText}` || 'Error');
        this.tabTitle = this.title;
        const url = Jam.UrlHelper.getPageModalUrl(this.getLoadUrl());
        this.$title.html(`<a href="${url}" target="_blank"><span class="text-danger">${this.title}</span></a>`);
        this.resize();
        this.stack.afterLoad(this);
    }

    getLoadUrl () {
        return this.loadParams ? Jam.UrlHelper.addParams(this.url, this.loadParams) : this.url;
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
        data = event.data || data; // event.data can be set by listener
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
        if (this.checkLastActive()) {
            this.forceClose({reload: true, ...data});
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
        if (this.stack.isActiveLast(this.$frame)) {
            return true;
        }
        Jam.dialog.alert('Close the last modal tab');
    }

    find () {
        return this.$container.find(...arguments);
    }

    findInstanceByClass (instanceClass) {
        return Jam.Element.findInstanceByClass(instanceClass, this.$container);
    }

    findScroll () {
        return this.$body.children('.jmodal-scroll-container');
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
            this.$container = this.$frame.children('.jmodal-container');
            this.$body = this.$container.children('.jmodal-body');
            this.$header = this.$container.children('.jmodal-header');
            this.$title = this.$header.children('.jmodal-title');
        }
        this.$frame.data('modal', this);
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

Jam.ModalStackToggle = class ModalStackToggle {

    constructor (stack) {
        this.stack = stack;
        this.$stack = stack.$container.find('.jmodal-stack');
        this.$root = this.$stack.find('.root');
        this.$pool = this.$stack.find('.jmodal-stack-pool');
        this.template = Jam.Helper.getTemplate('stack', stack.$container);
        this.init();
    }

    init () {
        this.$pool.on('click','.jmodal-stack-toggle', event => {
            this.stack.setActive($(event.currentTarget).data('modal'));
        });
        this.$pool.on('click', event => {
            if (event.target === event.currentTarget) {
                this.stack.closeLastFrame();
            }
        });
        this.$root.click(() => this.stack.setActive(null));
    }

    findFrame (frame) {
        return this.$pool.children().filter((index, element) => $(element).data('modal') === frame);
    }

    attach (frame) {
        let $new = $(Jam.Helper.resolveTemplate(this.template, {
            title: Jam.Helper.escapeTags(frame.title),
            text: frame.tabTitle
        }));
        let $frame = this.findFrame(frame);
        if ($frame.length) {
            $frame.html($new.html());
        } else {
            $new.data('modal', frame);
            this.$pool.append($new);
        }
        this.resize();
    }

    detach () {
        this.$pool.children().last().remove();
        this.resize();
    }

    resize () {
        const frame = this.stack.getActive();
        if (!frame) {
            return false;
        }
        const $children = this.$pool.children();
        $children.filter('.active').removeClass('active');
        $children.filter((index, element) => $(element).data('modal') === frame).addClass('active');
        frame.$frame.prepend(this.$stack);
        if (this.$stack.css('position') === 'fixed') {
            this.resolveMaxWidth(frame, $children);
        }
    }

    resolveMaxWidth (frame, $children) {
        const left = frame.$container.offset().left;
        this.$stack.offset({left});

        const poolWidth = frame.$container.width() - this.$root.outerWidth();
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