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

    async onItem (event) {
        event.preventDefault();
        await this.confirm();
        this.execute();
    }

    checkModelChanges () {
        if (this.getModel().isChanged()) {
            return Jam.dialog.alert('Save changes first');
        }
    }

    async confirm () {
        if (this.params.confirmation) {
            await Jam.dialog.confirm(this.params.confirmation);
        }
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