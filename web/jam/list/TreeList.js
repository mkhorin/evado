/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
Jam.TreeList = class TreeList extends Jam.List {

    createDataGrid () {
        this.grid = new Jam.TreeGrid(this.$grid, this.params);
    }
};