/**
 * @copyright Copyright (c) 2021 Maxim Khorin <maksimovichu@gmail.com>
 */
Jam.FrameStack = class FrameStack extends Jam.Element {

    static load (frame, url, params, afterClose) {
        return frame.load(url, params).done(() => {
            frame.one('afterClose', (event, data) => {
                if (data?.reopen) {
                    this.load(frame, url, params, afterClose);
                }
                if (typeof afterClose === 'function') {
                    afterClose(data);
                }
            });
        });
    }

    static attachFrameLinks () {
        $(document.body).on('click', '.frame-link', this.onFrameLink.bind(this));
    }

    static onFrameLink (event) {
        event.preventDefault();
        const link = event.currentTarget;
        const url = link.getAttribute('href') || link.dataset.url;
        if (!Jam.frameStack || event.ctrlKey || link.getAttribute('target') === '_blank') {
            Jam.UrlHelper.openNewPageFrame(url, link.dataset.base);
        } else {
            Jam.dialog.close();
            this.load(Jam.frameStack.createFrame(), url);
        }
    }

    constructor ($container) {
        super($container);
        Jam.frameStack = this;
        this.$container = $container;
        this.$pool = $container.find('.frame-stack-pool');
        this.template = Jam.Helper.getTemplate('frame', $container);
        this.handlers = [];
        this.tabs = new Jam.StackTabs(this);
        this.$container.on('keyup', this.onKeyUp.bind(this));
    }

    init () {
        $('.frame-stack-back').click(this.onBack.bind(this));
        $(window).resize(this.onResize.bind(this));
    }

    isActiveLast () {
        const $active = this.$pool.children('.active');
        const $tabbed = this.getTabbed();
        return $active.length
            ? $active.next('.tabbed').length === 0
            : $tabbed.length === 0;
    }

    getActive () {
        return this.$pool.children('.active').last().data('frame');
    }

    setActive (frame) {
        this.$pool.children('.active').removeClass('active');
        if (!frame) {
            return $(document.body).addClass('frame-stack-collapsed');
        }
        $(document.body).addClass('frame-stack-active');
        frame.setActive();
        this.tabs.resize();
    }

    isLast ($frame) {
        return this.getLast().$frame.get(0) === $frame.get(0);
    }

    getLast () {
        return this.getTabbed().last().data('frame');
    }

    getFrame ($element) {
        return $element.closest('.stack-frame').data('frame');
    }

    getTabbed () {
        return this.$pool.children('.tabbed');
    }

    createFrame () {
        return new Jam.StackFrame(this);
    }

    buildFrame (frame) {
        let $frame = this.$pool.children().not('.tabbed').eq(0);
        if ($frame.length) {
            return $frame;
        }
        $frame = $(this.template);
        this.$pool.append($frame);
        $frame.on('click', '.frame-stack-tabs .close', () => frame.close());
        $frame.click(this.onFrame.bind(this, frame));
        return $frame;
    }

    onFrame (frame, event) {
        if (event.target === event.currentTarget) {
            frame.close();
        }
    }

    onLoad (fn) {
        this.handlers.push(fn);
    }

    afterLoad (frame) {
        Jam.MainAlert.clear();
        this.setActive(frame);
        this.tabs.attach(frame);
        for (const handler of this.handlers) {
            handler(frame);
        }
        this.handlers = [];
        frame.trigger('afterLoad');
    }

    afterClose (frame) {
        frame.$frame.removeClass('tabbed active');
        const last = this.getLast();
        last?.setActive();
        $(document.body).toggleClass('frame-stack-active', !!last);
        this.tabs.detach(frame);
    }

    onResize () {
        this.$pool.children().each((index, element) => $(element).data('frame').resize());
        this.tabs.resize();
    }

    onBack () {
        $(document.body).removeClass('frame-stack-collapsed');
        this.setActive(this.getLast());
    }

    onKeyUp (event) {
        if (event.key === 'Escape') {
            this.closeLast();
        }
    }

    closeLast () {
        this.getLast()?.close();
    }

    openFromUrl (url) {
        const {frame} = Jam.UrlHelper.getParams(url);
        if (frame) {
            this.createFrame().load(frame);
        }
    }
};