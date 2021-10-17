/**
 * @copyright Copyright (c) 2021 Maxim Khorin <maksimovichu@gmail.com>
 */
Jam.SortListArray = class SortListArray extends Jam.SortList {

    setSourceOrderNumbers () {
        // clear parent implementation
    }

    getChangedOrder () {
        const result = [];
        for (const item of this.findItems()) {
            result.push(item.dataset.id);
        }
        return result;
    }

    onDoneSaveClose () {
        this.changed = false;
        this.saved = true;
        this.frame.close({order: this.getChangedOrder()});
    }
};