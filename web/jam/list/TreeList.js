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

    selectItemAfterLoad (id) {
        const $item = this.findItemById(id);
        if ($item.length !== 1) {
            return super.selectItemAfterLoad(id);
        }
        const parent = this.grid.getNodeByItem($item).getParentNode();
        if (!parent) {
            return super.selectItemAfterLoad(id);
        }
        parent.load();
        this.grid.events.one('afterDrawNode', this.onAfterDrawNode.bind(this, id, parent));
    }

    onAfterDrawNode (id, parent) {
        this.toggleItemSelect(parent.getChildren().filter(this.findItemById(id)), true);
    }
};