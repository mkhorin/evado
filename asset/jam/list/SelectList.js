/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
Jam.SelectList = class SelectList extends Jam.FrameList {

    onDoubleClickRow (event) {
        this.deselectExceptOneRow(event.currentTarget);
        this.toggleRowSelect($(event.currentTarget), true);
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
            : this.selectByRows();
    }

    selectByRows () {
        const $rows = this.params.multiple
            ? this.getSelectedRows()
            : this.getSelectedRow();
        if ($rows) {
            this.frame.close({result: this.serializeObjectIds($rows)});
        }
    }

    selectByUrl (url) {
        const $rows = this.params.multiple
            ? this.getSelectedRows()
            : this.getSelectedRow();
        if ($rows) {
            const ids = this.serializeObjectIds($rows);
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