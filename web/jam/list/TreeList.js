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
        const node = this.grid.getNodeByItem($item);
        const parent = node.getParentNode();
        if (!parent) {
            return super.selectItemAfterLoad(id);
        }
        parent.load();
        this.grid.events.one('afterDrawNode', () => {
            this.onAfterDrawNode(id, parent);
        });
    }

    onAfterDrawNode (id, parent) {
        const item = this.findItemById(id);
        const nodes = parent.getChildren().filter(item);
        this.toggleItemSelect(nodes, true);
    }
};