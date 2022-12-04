/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
Jam.Utility = class Utility {

    constructor ($item, manager, params) {
        this.$item = $item;
        this.manager = manager;
        this.params = params;
        this.frame = Jam.frameStack.getFrame(manager.$container);
        this.init();
    }

    init () {
        this.$item.click(this.onItem.bind(this));
    }

    getList () {
        const $grid = this.manager.$container.closest('.data-grid');
        return Jam.Element.getInstance($grid);
    }

    getModel () {
        return this.frame?.findInstanceByClass(Jam.Model);
    }

    getUrl () {
        return this.manager.url;
    }

    getRequestData (data) {
        return {
            id: this.params.id,
            ...this.manager.getRequestData(),
            ...data
        };
    }

    onItem (event) {
        event.preventDefault();
        this.confirm().then(this.execute.bind(this));
    }

    checkModelChanges () {
        if (this.getModel().isChanged()) {
            return Jam.dialog.alert('Save changes first');
        }
    }

    confirm () {
        return this.params.confirmation
            ? Jam.dialog.confirm(this.params.confirmation)
            : $.Deferred().resolve();
    }

    /**
     * Override utility actions
     */
    execute () {
    }

    parseModelError (data) {
        this.getModel().error.parseXhr(data);
    }
};