/**
 * @copyright Copyright (c) 2021 Maxim Khorin <maksimovichu@gmail.com>
 */
Jam.SortListArray = class SortListArray extends Jam.SortList {

    setSourceOrderNumbers () {
        // clear parent implementation
    }

    getChangedOrder () {
        const result = [];
        const items = this.findItems();
        for (const item of items) {
            result.push(item.dataset.id);
        }
        return result;
    }

    onDoneSaveClose () {
        this.changed = false;
        this.saved = true;
        const order = this.getChangedOrder();
        this.frame.close({order});
    }
};