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
            const data = this.grid.getData(item.dataset.id, column);
            this.sourceOrderNumbers.push(data);
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
        this.move(this.moveDown);
    }

    onUp () {
        this.move(this.moveUp);
    }

    move (method) {
        const $items = this.getSelectedItems();
        if ($items) {
            method.call(this, $items);
        }
        this.changed = this.getChangedOrder();
    }

    moveDown ($items) {
        let $item = $items.eq(-1);
        if (this.swapItems($item.next(), $item)) {
            for (let i = $items.length - 2; i >= 0; --i) {
                $item = $items.eq(i);
                this.swapItems($item.next(), $item);
            }
        }
    }

    moveUp ($items) {
        let $item = $items.eq(0);
        if (this.swapItems($item, $item.prev())) {
            for (let i = 1; i < $items.length; ++i) {
                $item = $items.eq(i);
                this.swapItems($item, $item.prev());
            }
        }
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