/**
 * @copyright Copyright (c) 2022 Maxim Khorin <maksimovichu@gmail.com>
 */
Jam.ScrollHelper = class ScrollHelper {

    static hasDocumentScroll () {
        return $(document).height() > $(window).height();
    }

    static isScrollableElement (element) {
        const style = getComputedStyle($(element)[0]);
        return /(auto|scroll)/.test(style.overflow + style.overflowY + style.overflowX);
    }

    static scrollTo (target, container, duration = 'fast', done) {
        const top = Number.isFinite(target)
            ? target
            : this.getScrollTopOffset(target, container);
        const $container = $(container || document.documentElement);
        $container.animate({scrollTop: `${top}px`}, {duration}, done);
    }

    static getScrollTopOffset (target, container) {
        const targetTop = $(target).offset()?.top;
        if (!container) {
            return Math.floor(targetTop || 0);
        }
        const $container = $(container);
        const diff = targetTop - $container.offset()?.top;
        const top = $container[0]?.scrollTop + diff;
        return Math.floor(top || 0);
    }

    static getClosestScrollableParent (target) {
        const $parent = $(target).parent();
        if ($parent.length) {
            return this.isScrollableElement($parent)
                ? $parent
                : this.getClosestScrollableParent($parent);
        }
    }
};