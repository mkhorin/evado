/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
Jam.IndexSorting = class IndexSorting extends Jam.Element {

    init () {
        this.sort();
    }

    sort () {
        this.$element.children()
            .sort((a, b) => a.dataset.index - b.dataset.index)
            .appendTo(this.$element);
    }
};