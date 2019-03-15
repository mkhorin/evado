'use strict';

Ant.DataGrid.defaults = {
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
        {'a': 'a2', 'b': 'b2', 'c': 'c6'},
        {'a': 'a3', 'b': 'b3', 'c': 'c7'},
        {'a': 'a4', 'b': 'b4', 'c': 'c8'},
        {'a': 'a1', 'b': 'b1', 'c': 'c9'},
        {'a': 'a2', 'b': 'b2', 'c': 'c10'},
        {'a': 'a3', 'b': 'b3', 'c': 'c11'},
        {'a': 'a4', 'b': 'b4', 'c': 'c12'},
        {'a': 'a1', 'b': 'b1', 'c': 'c1'},
        {'a': 'a2', 'b': 'b2', 'c': 'c2'},
        {'a': 'a3', 'b': 'b3', 'c': 'c3'},
        {'a': 'a4', 'b': 'b4', 'c': 'c4'},
        {'a': 'a1', 'b': 'b1', 'c': 'c5'},
        {'a': 'a2', 'b': 'b2', 'c': 'c6'},
        {'a': 'a3', 'b': 'b3', 'c': 'c7'},
        {'a': 'a4', 'b': 'b4', 'c': 'c8'},
        {'a': 'a1', 'b': 'b1', 'c': 'c9'},
        {'a': 'a2', 'b': 'b2', 'c': 'c10'},
        {'a': 'a3', 'b': 'b3', 'c': 'c11'},
        {'a': 'a4', 'b': 'b4', 'c': 'c12'},
        {'a': 'a3', 'b': 'b3', 'c': 'c7'},
        {'a': 'a4', 'b': 'b4', 'c': 'c8'},
        {'a': 'a1', 'b': 'b1', 'c': 'c9'},
        {'a': 'a2', 'b': 'b2', 'c': 'c10'},
        {'a': 'a3', 'b': 'b3', 'c': 'c11'},
        {'a': 'a4', 'b': 'b4', 'c': 'c12'},
        {'a': 'a1', 'b': 'b1', 'c': 'c1'},
        {'a': 'a2', 'b': 'b2', 'c': 'c2'},
        {'a': 'a3', 'b': 'b3', 'c': 'c3'},
        {'a': 'a4', 'b': 'b4', 'c': 'c4'},
        {'a': 'a1', 'b': 'b1', 'c': 'c5'},
        {'a': 'a2', 'b': 'b2', 'c': 'c6'},
        {'a': 'a3', 'b': 'b3', 'c': 'c7'},
        {'a': 'a4', 'b': 'b4', 'c': 'c8'},
        {'a': 'a1', 'b': 'b1', 'c': 'c9'},
        {'a': 'a2', 'b': 'b2', 'c': 'c10'},
        {'a': 'a3', 'b': 'b3', 'c': 'c11'},
        {'a': 'a4', 'b': 'b4', 'c': 'c12'}, //*/
    ],
    hideOnePageToggle: true,
    hideColumnGroups: false,
    page: 0,
    pageSize: 10,
    pageSizes: [10, 20, 30, 40, 50],
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
    'AjaxProvider': Ant.DataGrid.AjaxProvider,
    'ColumnManager': Ant.DataGrid.ColumnManager,
    'CommonSearch': Ant.DataGrid.CommonSearch,
    'PageJumper': Ant.DataGrid.PageJumper,
    'Pagination': Ant.DataGrid.Pagination,
    'Provider': Ant.DataGrid.Provider,
    'Renderer': Ant.DataGrid.Renderer
};
