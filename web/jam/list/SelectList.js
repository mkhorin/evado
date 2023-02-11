/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
Jam.SelectList = class SelectList extends Jam.FrameList {

    onDoubleClickItem (event) {
        this.deselectExceptOneItem(event.currentTarget);
        this.toggleItemSelect($(event.currentTarget), true);
        event.ctrlKey
            ? this.openNewPage()
            : this.onSelect();
    }

    getCommandMethod (name) {
        switch (name) {
            case 'select': return this.onSelect;
        }
        return super.getCommandMethod(name);
    }

    onSelect () {
        this.params.select
            ? this.selectByUrl(this.params.select)
            : this.selectByItems();
    }

    selectByItems () {
        const $items = this.multiple
            ? this.getSelectedItems()
            : this.getSelectedItem();
        if ($items) {
            const result = this.serializeObjectIds($items);
            this.frame.close({result});
        }
    }

    selectByUrl (url) {
        const $items = this.multiple
            ? this.getSelectedItems()
            : this.getSelectedItem();
        if ($items) {
            const ids = this.serializeObjectIds($items);
            return this.post(url, {ids}).done(this.onDoneSelection.bind(this));
        }
    }

    onDoneSelection (id) {
        this.frame.close({
            result: id,
            saved: true
        });
    }
};