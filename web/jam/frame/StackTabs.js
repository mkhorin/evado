/**
 * @copyright Copyright (c) 2021 Maxim Khorin <maksimovichu@gmail.com>
 */
Jam.StackTabs = class StackTabs {

    constructor (stack) {
        this.stack = stack;
        this.$tabs = stack.$container.find('.frame-stack-tabs');
        this.$root = this.$tabs.find('.root');
        this.$pool = this.$tabs.find('.frame-stack-tabs-pool');
        this.template = Jam.Helper.getTemplate('tab', stack.$container);
        this.init();
    }

    init () {
        this.$pool.on('click','.frame-stack-tab', this.onTab.bind(this));
        this.$pool.on('click', this.onPool.bind(this));
        this.$root.click(this.onRoot.bind(this));
    }

    onTab (event) {
        this.stack.setActive($(event.currentTarget).data('frame'));
    }

    onPool (event) {
        if (event.target === event.currentTarget) {
            this.stack.closeLast();
        }
    }

    onRoot () {
        this.stack.setActive(null);
    }

    findFrame (frame) {
        return this.$pool.children().filter((index, element) => {
            return $(element).data('frame') === frame;
        });
    }

    attach (frame) {
        const title = Jam.escape(frame.title);
        const text = frame.tabTitle;
        const content = Jam.Helper.resolveTemplate(this.template, {title, text});
        const $new = $(content);
        const $frame = this.findFrame(frame);
        if ($frame.length) {
            $frame.html($new.html());
        } else {
            $new.data('frame', frame);
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
        this.findFrame(frame).addClass('active');
        frame.$frame.prepend(this.$tabs);
        const position = this.$tabs.css('position');
        if (position === 'fixed') {
            this.resolveMaxWidth(frame, $children);
        }
    }

    resolveMaxWidth (frame, $children) {
        const left = frame.$container.offset().left;
        this.$tabs.offset({left});

        const frameWidth = frame.$container.width();
        const rootWidth = this.$root.outerWidth();
        const poolWidth = frameWidth - rootWidth;
        this.$pool.width(poolWidth);
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