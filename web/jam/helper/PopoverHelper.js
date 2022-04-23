/**
 * @copyright Copyright (c) 2022 Maxim Khorin <maksimovichu@gmail.com>
 */
Jam.PopoverHelper = class PopoverHelper {

    static HIDE_EVENT = 'click.popover';

    static initHints ($container, params) {
        params = {
            container: $container.get(0),
            showOnCreate: false,
            targetSelector: `.hint-icon`,
            trigger: 'click',
            ...params
        };
        this.addEventListeners($container, params);
    }

    static addEventListeners ($container, params) {
        $container.on('mouseenter', params.targetSelector, ({target}) => this.create(target, params));
        $container.on('shown.bs.popover', this.onShow.bind(this));
        $container.on('hide.bs.popover', this.onHide.bind(this));
    }

    static getInstance (element) {
        return bootstrap.Popover.getInstance(element);
    }

    static create (target, params) {
        if (!this.getInstance(target)) {
            const popover = new bootstrap.Popover(target, params);
            if (params?.showOnCreate) {
                popover.show();
            }
        }
    }

    static onShow (event) {
        $(document.body).on(this.HIDE_EVENT, this.onHideEvent.bind(this, event.target));
    }

    static onHide () {
        $(document.body).off(this.HIDE_EVENT);
    }

    static onHideEvent (source, {target}) {
        const popover = this.getInstance(source);
        if (popover && !popover.getTipElement()?.contains(target)) {
            popover.hide();
        }
    }
};