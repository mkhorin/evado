/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
Jam.SortList = class SortList extends Jam.List {

    init () {
        super.init();
        this.saved = false;
        this.beforeCloseMethod = this.beforeClose.bind(this);
        this.frame.onClose(this.beforeCloseMethod);
        this.frame.findScrollHeader().append(this.$commands);
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
        for (const item of this.findItems()) {
            this.sourceOrderNumbers.push(this.grid.getData(item.dataset.id, column));
        }
    }

    getChangedOrder () {
        const column = this.getSourceOrderColumn();
        const data = {};
        this.findItems().each((index, item) => {
            const value = this.grid.getData(item.dataset.id, column);
            if (value !== this.sourceOrderNumbers[index]) {
                data[item.dataset.id] = this.sourceOrderNumbers[index];
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
        const $items = this.getSelectedItems();
        if ($items && this.swapItems($items.eq(-1).next(), $items.eq(-1))) {
            for (let i = $items.length - 2; i >= 0; --i) {
                this.swapItems($items.eq(i).next(), $items.eq(i));
            }
        }
        this.changed = this.getChangedOrder();
    }

    onUp () {
        const $items = this.getSelectedItems();
        if ($items && this.swapItems($items.eq(0), $items.eq(0).prev())) {
            for (let i = 1; i < $items.length; ++i) {
                this.swapItems($items.eq(i), $items.eq(i).prev());
            }
        }
        this.changed = this.getChangedOrder();
    }

    onMouseWheel (event) {
        if (this.findSelectedItems().length) {
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
        const order = this.getChangedOrder();
        return this.post(this.params.url, {order})
            .done(this.onDoneSaveClose.bind(this));
    }

    onDoneSaveClose () {
        this.changed = false;
        this.saved = true;
        this.frame.close();
    }

    cancel () {
        this.changed = false;
        this.frame.close();
    }

    swapItems ($1, $2) {
        if (!$2.length || !$1.length) {
            return false;
        }
        $1.after($2);
        this.grid.clearOrder();
        return true;
    }
};