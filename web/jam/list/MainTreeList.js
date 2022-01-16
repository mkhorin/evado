/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
Jam.MainTreeList = class MainTreeList extends Jam.TreeList {

    onCreate (event) {
        const $item = this.findSelectedItems();
        if ($item.length !== 1) {
            return super.onCreate(event);
        }
        const node = this.grid.getNodeByItem($item);
        super.onCreate(event, {
            node: node.getId(),
            depth: node.getDepth()
        });
    }
};