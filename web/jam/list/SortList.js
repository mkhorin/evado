/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

Jam.SortList = class SortList extends Jam.List {

    init () {
        super.init();
        this.saved = false;
        this.beforeCloseMethod = this.beforeClose.bind(this);
        this.modal.onClose(this.beforeCloseMethod);
        this.modal.findScrollHeader().append(this.$commands);
        //this.$tbody.on('mousewheel', this.onMouseWheel.bind(this));
    }

    getCommandMethod (name) {
        switch (name) {
            case 'down': return this.onDown;
            case 'up': return this.onUp;
            case 'saveClose': return this.onSaveClose;
        }
        return super.getCommandMethod(name);
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
        const column = this.getSourceOrderColumn();
        for (const row of this.findRows()) {
            this.sourceOrderNumbers.push(this.grid.getData(row.dataset.id, column));
        }
    }

    getChangedOrder () {
        const column = this.getSourceOrderColumn(), data = {};
        this.findRows().each((index, row) => {
            const value = this.grid.getData(row.dataset.id, column);
            if (value !== this.sourceOrderNumbers[index]) {
                data[row.dataset.id] = this.sourceOrderNumbers[index];
            }
        });
        return Object.values(data).length ? data : null;
    }

    beforeClose (event) {
        if (this.changed) {
            event.deferred = Jam.dialog.confirm('Close without saving?');
        }
        event.data = {saved: this.saved};
    }

    onDown () {
        const $rows = this.getSelectedRows();
        if ($rows && this.swapRows($rows.eq(-1).next(), $rows.eq(-1))) {
            for (let i = $rows.length - 2; i >= 0; --i) {
                this.swapRows($rows.eq(i).next(), $rows.eq(i));
            }
        }
        this.changed = this.getChangedOrder();
    }

    onUp () {
        const $rows = this.getSelectedRows();
        if ($rows && this.swapRows($rows.eq(0), $rows.eq(0).prev())) {
            for (let i = 1; i < $rows.length; ++i) {
                this.swapRows($rows.eq(i), $rows.eq(i).prev());
            }
        }
        this.changed = this.getChangedOrder();
    }

    onMouseWheel (event) {
        if (this.findSelectedRows().length) {
            if (event.originalEvent.deltaY < 0) {
                return this.onUp();
            }
            if (event.originalEvent.deltaY > 0) {
                return this.onDown();
            }
        }
    }

    onSaveClose () {
        if (!this.changed) {
            return this.cancel();
        }
        this.post(this.params.url, {
            order: this.getChangedOrder()
        }).done(()=> {
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