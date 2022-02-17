/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
Jam.TreeList = class TreeList extends Jam.List {

    createDataGrid () {
        this.grid = new Jam.TreeGrid(this.$grid, this.params);
    }

    onCreate (event, params) {
        const $item = this.findSelectedItems();
        if ($item.length !== 1) {
            return super.onCreate(event, params);
        }
        const node = this.grid.getNodeByItem($item);
        super.onCreate(event, {
            ...params,
            node: node.getId(),
            depth: node.getDepth()
        });
    }

    reload (id) {
        const $items = this.findItemById(id);
        if (!$items.length) {
            return super.reload();
        }
        for (const item of $items) {
            this.grid.getNodeByItem($(item)).reloadParent();
        }
    }
};