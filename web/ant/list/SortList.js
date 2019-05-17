'use strict';

Ant.SortList = class extends Ant.List {

    init () {
        super.init();

        this.saved = false;
        this.beforeCloseMethod = this.beforeClose.bind(this);
        this.modal.onClose(this.beforeCloseMethod);
        // this.getControl('reload').hide();
        this.getControl('up').click(this.up.bind(this));
        this.getControl('down').click(this.down.bind(this));
        this.getControl('saveClose').click(this.onSaveClose.bind(this));
        this.getControl('cancel').click(this.cancel.bind(this));
        //this.$tbody.on('mousewheel', this.onMouseWheel.bind(this));
    }

    afterDrawPage (event) {
        super.afterDrawPage(event);
        this.setSourceOrderNumbers();
    }

    getSourceOrderColumn () {
        return Object.keys(this.params.order)[0];
    }

    setSourceOrderNumbers () {
        this.changed = false;
        this.sourceOrderNumbers = [];
        let column = this.getSourceOrderColumn();
        for (let row of this.findRows()) {
            this.sourceOrderNumbers.push(this.grid.getData(row.dataset.id, column));
        }
    }

    getChangedOrder () {
        let column = this.getSourceOrderColumn(), data = {};
        this.findRows().each((index, row) => {
            let value = this.grid.getData(row.dataset.id, column);
            if (value !== this.sourceOrderNumbers[index]) {
                data[row.dataset.id] = this.sourceOrderNumbers[index];
            }
        });
        return Object.values(data).length ? data : null;
    }

    beforeClose (event) {
        if (this.changed && !Ant.Helper.confirm('Close without saving?')) {
            event.stopPropagation();
        }
        event.data = {saved: this.saved};
    }

    up () {
        let $rows = this.getSelectedRows();
        if ($rows && this.swapRows($rows.eq(0), $rows.eq(0).prev())) {
            for (let i = 1; i < $rows.length; ++i) {
                this.swapRows($rows.eq(i), $rows.eq(i).prev());
            }
        }
        this.changed = this.getChangedOrder();
    }

    down () {
        let $rows = this.getSelectedRows();
        if ($rows && this.swapRows($rows.eq(-1).next(), $rows.eq(-1))) {
            for (let i = $rows.length - 2; i >= 0; --i) {
                this.swapRows($rows.eq(i).next(), $rows.eq(i));
            }
        }
        this.changed = this.getChangedOrder();
    }

    onMouseWheel (event) {
        if (this.findSelectedRows().length) {
            if (event.originalEvent.deltaY < 0) {
                return this.up();
            }
            if (event.originalEvent.deltaY > 0) {
                return this.down();
            }
        }
    }

    onSaveClose (event) {
        if (!this.changed) {
            return this.cancel();
        }
        this.post(this.params.url, {
            order: this.getChangedOrder()
        }).done(data => {
            this.changed = false;
            this.saved = true;
            this.modal.close();
        });
    }

    cancel () {
        this.changed = false;
        this.modal.close();
    }

    swapRows ($1, $2) {
        if (!$2.length || !$1.length) {
            return false;
        }
        $1.after($2);
        this.grid.clearOrder();
        return true;
    }
};