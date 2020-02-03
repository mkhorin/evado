/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

Jam.DataGrid.defaults = {
    columns: [
         //{name: 'b', label: 'B', group: 'g1', sortable: true, searchable: true, hidden: false}
    ],
    columnGroups: [
        // {name: 'g1', label: 'G1', parent: null, hidden: false}
    ],
    rowGroups: {
        // column:
    },
    data: [
        /* {'a': 'a1', 'b': 'b1', 'c': 'c1'},
        {'a': 'a2', 'b': 'b2', 'c': 'c2'},
        {'a': 'a3', 'b': 'b3', 'c': 'c3'},
        {'a': 'a4', 'b': 'b4', 'c': 'c4'},
        {'a': 'a1', 'b': 'b1', 'c': 'c5'},
        {'a': 'a1', 'b': 'b1', 'c': 'c9'},
        {'a': 'a2', 'b': 'b2', 'c': 'c10'},
        {'a': 'a3', 'b': 'b3', 'c': 'c11'},
        {'a': 'a4', 'b': 'b4', 'c': 'c12'}, //*/
    ],
    hideOnePageToggle: true,
    hideColumnGroups: false,
    page: 0,
    pageSize: 10,
    pageSizes: [10, 20, 30],
    keepPageSize: true,
    maxPageToggles: 9,
    order: null,
    locale: {
        orderToggle: 'Sort',
        searchToggle: 'Search',
        asc: 'Ascending',
        desc: 'Descending',
        pagination: {
            first: '<<',
            last: '>>',
            previous: '<',
            next: '>'
        },
        info: 'Showing #{START} to #{END} of #{TOTAL}',
        infoEmpty: 'Showing 0 to 0 of 0',
        infoFiltered: '(filtered from #{MAX})'
    },
    AjaxProvider: Jam.DataGridAjaxProvider,
    CommonSearch: Jam.DataGridCommonSearch,
    PageJumper: Jam.DataGridPageJumper,
    Pagination: Jam.DataGridPagination,
    Provider: Jam.DataGridProvider,
    Renderer: Jam.DataGridRenderer,
    Tuner: Jam.DataGridTuner
};

Jam.TreeGrid.defaults = {
    clearCollapsedNode: true,
    nodeToggle: '<div class="node-toggle"><span class="glyphicon"></span></div>',
    Renderer: Jam.TreeGridRenderer,
    AjaxProvider: Jam.TreeGridAjaxProvider
};