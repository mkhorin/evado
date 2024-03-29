/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
Jam.UtilityManager = class UtilityManager extends Jam.Element {

    init () {
        this.$container = this.$element;
        this.params = this.$container.data('params') || {};
        this.url = this.$container.data('url');
        this.menu = new (this.getMenuClass())(this);
    }

    getMenuClass () {
        switch (this.params.menu) {
            case 'bar': return Jam.UtilityBar;
        }
        return Jam.UtilityMenu;
    }

    getRequestData () {
        return {
            action: this.params.action,
            meta: this.params.meta,
            model: this.params.model
        };
    }

    getUtilityClass ({clientClass}) {
        if (!clientClass) {
            return null;
        }
        const Class = Jam.Utility[clientClass];
        if (typeof Class === 'function') {
            if (Jam.Utility.hasOwnProperty(clientClass)) {
                return Class;
            }
        }
        console.error('Invalid utility class:', clientClass);
    }

    createUtility ($item, data) {
        const Class = this.getUtilityClass(data);
        if (Class) {
            return new Class($item, this, data);
        }
    }
};