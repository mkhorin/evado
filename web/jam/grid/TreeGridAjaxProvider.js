/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
Jam.TreeGridAjaxProvider = class TreeGridAjaxProvider extends Jam.DataGridAjaxProvider {

    load ({node}) {
        this.node = node;
        super.load();
    }

    getRequestData () {
        const data = super.getRequestData();
        if (this.node) {
            data.length = 0;
            data.node = this.node.getId();
            data.depth = this.node.getDepth();
        }
        return data;
    }
};