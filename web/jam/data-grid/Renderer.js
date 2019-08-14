/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

Jam.DataGridRenderer = class {

    constructor (grid) {
        this.$table = grid.$container.find('.data-grid-table');
        this.$thead = this.$table.children('thead');
        this.$tbody = this.$table.children('tbody');
        this.$tfoot = this.$table.children('tfoot');
        this.params = grid.params;
        this.locale = this.params.locale;
        this.grid = grid;
        Jam.ObjectHelper.assignUndefined(this.params, {
            getRowId: this.getRowId.bind(this),
            renderBodyRow: this.renderBodyRow.bind(this),
            renderBodyCell: this.renderBodyCell.bind(this),
            renderHeadColumn: this.renderHeadColumn.bind(this),
            renderHeadGroup: this.renderHeadGroup.bind(this),
        });
        this.initColumns();
    }

    initColumns () {
        for (const column of this.params.columns) {
            if (typeof column.render !== 'function') {
                column.render = this.renderCellValue.bind(this);
            }
        }
    }

    findRows (selector) {
        return this.$tbody.children(selector);
    }

    findRowById (id) {
        return this.$tbody.children(`[data-id="${id}"]`);
    }

    getRowId (data) {
        return this.params.key ? data[this.params.key] : '';
    }

    getNameCells (name) {
        return this.$table.find(`tbody [data-name="${name}"]`);
    }

    getDirectionCode (direction) {
        return direction === 1 ? ' asc' : direction === -1 ? ' desc' : '';
    }

    toggleOrder ($toggle, direction) {
        const $cell = $toggle.closest('th');
        const name = $cell.data('name');
        const code = this.getDirectionCode(direction);
        $cell.removeClass('asc').removeClass('desc').addClass(code);
        $toggle.attr('title', this.locale[code]);
        this.getNameCells(name).toggleClass('ordered', !!code);
    }

    clearOrder () {
        this.$thead.find('.asc').removeClass('asc');
        this.$thead.find('.desc').removeClass('desc');
        this.$table.find('.ordered').removeClass('ordered');
    }

    drawTableFrame () {
        this.columns = this.grid.getVisibleColumns();
        this.$thead.html(this.renderHead());
        this.$tfoot.html(this.renderFooter());
    }

    drawBody (data) {
        this.$tbody.html(this.renderBody(data));
        Jam.DateHelper.resolveClientDate(this.$tbody);
    }

    renderBody (data) {
        return data.map(row => this.renderBodyRow(row)).join('');
    }

    renderBodyRow (data) {
        if (!data) {
            return '';
        }
        let content = '';
        for (let i = 0; i < this.columns.length; ++i) {
            content += this.renderBodyCell(data, this.columns[i], i);
        }
        return this.renderBodyRowHtml(this.params.getRowId(data), content, ...arguments);
    }

    renderBodyRowHtml (id, content) {
        return `<tr data-id="${id}">${content}</tr>`;
    }

    renderBodyCell (data, column, index) {
        const value = column.render(data[column.name], column, index, data);
        return this.renderBodyCellHtml(value, column, index, data);
    }

    renderBodyCellHtml (value, column) {
        return `<td class="${this.getBodyCellClass(...arguments)}" data-name="${column.name}">${value}</td>`;
    }

    renderCellValue (value) {
        return value;
    }

    getBodyCellClass (value, column) {
        const cssClass = this.grid.getOrderDirection(column.name) ? ' ordered' : '';
        return column.cssClass ? `${cssClass} ${column.cssClass}` : cssClass;
    }

    // HEAD

    renderHead () {
        return this.createHeadByMatrix(this.createHeadMatrix(this.columns));
    }

    renderHeadColumn (column, col, row) {
        const name = column.name;
        let cssClass = 'column';
        if (this.grid.isSortableColumn(name)) {
            cssClass += ' sortable '+ this.getDirectionCode(this.grid.getOrderDirection(name));
        }
        const label = this.grid.translate(column.label || name);
        return '<th class="'+ cssClass +'" rowspan="'+ row +'" data-name="'+ name +'">'
            + '<span class="column-label search-toggle" title="'+ name +'">'+ label +'</span>'
            + '<span class="order-toggle fa" title="'+ this.locale.orderToggle +'"></span></th>';
    }

    renderHeadGroup (group, col, row) {
        const label = this.grid.translate(group.label || group.name);
        return `<th class="group" colspan="${col}" rowspan="${row}" data-name="${group.name}">${label}</th>`;
    }

    createHeadMatrix (columns) {
        this.setGroupLevels(columns);
        const matrix = [columns];
        for (let x = 0; x < columns.length; ++x) {
            let column = columns[x];
            let group = this.grid.columnGroupMap[column.group];
            while (group && typeof group === 'object') {
                if (!matrix[group._level]) {
                    matrix[group._level] = [];
                }
                matrix[group._level][x] = group;
                group = this.grid.columnGroupMap[group.parent];
            }
        }
        this.fillEmptyMatrixCells(matrix, columns);
        return matrix;
    }

    setGroupLevels (columns) {
        for (const column of columns) {
            let level = 1;
            let group = this.grid.columnGroupMap[column.group];
            while (group && typeof group === 'object') {
                if (!group._level || group._level < level) {
                    group._level = level;
                }
                group._isGroup = true;
                group = this.grid.columnGroupMap[group.parent];
                level += 1;
            }
        }
    }

    fillEmptyMatrixCells (matrix, columns) {
        for (let y = 1; y < matrix.length; ++y) {
            for (let x = 0; x < columns.length; ++x) {
                if (!matrix[y][x]) {
                    matrix[y][x] = matrix[y - 1][x];
                }
            }
        }
    }

    createHeadByMatrix (matrix) {
        let result = '';
        for (let y = matrix.length - 1; y >= 0; --y) {
            result += `<tr>${this.createHeadRowByMatrix(y, matrix)}</tr>`;
        }
        return result;
    }

    createHeadRowByMatrix (y, matrix) {
        let result = '';
        for (let x = 0; x < matrix[0].length; ++x) {
            result += this.createHeadCell(x, y, matrix);
        }
        return result;
    }

    createHeadCell (x, y, matrix) {
        let colSpan = 1;
        let rowSpan = 1;
        let cell = matrix[y][x];
        if (matrix[y][x - 1] === cell || (matrix[y + 1] && matrix[y + 1][x] === cell)) {
            return '';
        }
        while (matrix[y][x + colSpan] === cell) {
            colSpan += 1;
        }
        while (matrix[y - rowSpan] && matrix[y - rowSpan][x] === cell) {
            rowSpan += 1;
        }
        return cell._isGroup
            ? this.params.renderHeadGroup(cell, colSpan, rowSpan)
            : this.params.renderHeadColumn(cell, colSpan, rowSpan);
    }

    // FOOTER

    renderFooter () {
        return '';
    }
};

Jam.TreeDataGridRenderer = class extends Jam.DataGridRenderer {

    drawNode ($row, items) {
        const depth = parseInt($row.data('depth')) + 1;
        $row.after(items.map(item => this.renderBodyRow(item, depth)).join(''));
    }

    renderBodyRowHtml (id, content, data, depth) {
        const cssClass = data._node_hasChildren ? 'has-children' : '';
        const nodeClass = data._node_class || '';
        return `<tr class="${cssClass}" data-depth="${depth || 0}" data-id="${id}" data-class="${nodeClass}">${content}</tr>`;
    }

    renderBodyCellHtml (value, column, index, data) {
        if (index === 0) {
            value += this.params.nodeToggle;
        }
        return super.renderBodyCellHtml(value, column, index, data);
    }
};