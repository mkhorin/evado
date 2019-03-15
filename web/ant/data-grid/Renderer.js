'use strict';

Ant.DataGrid.Renderer = class {

    constructor (grid) {
        this.$table = grid.$container.find('.data-grid-table');
        this.$thead = this.$table.children('thead');
        this.$tbody = this.$table.children('tbody');
        this.$tfoot = this.$table.children('tfoot');
        this.params = grid.params;
        this.locale = this.params.locale;
        this.grid = grid;
        Ant.ObjectHelper.assignUndefined(this.params, {
            'getRowId': this.getRowId.bind(this),
            'renderBodyRow': this.renderBodyRow.bind(this),
            'renderBodyCell': this.renderBodyCell.bind(this),
            'renderHeadColumn': this.renderHeadColumn.bind(this),
            'renderHeadGroup': this.renderHeadGroup.bind(this),
        });
        this.initColumns();
    }

    initColumns () {
        for (let column of this.params.columns) {
            if (!(column.render instanceof Function)) {
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
        let $cell = $toggle.closest('th');
        let name = $cell.data('name');
        let code = this.getDirectionCode(direction);        
        $cell.removeClass('asc').removeClass('desc').addClass(code);
        $toggle.attr('title', this.locale[code]);
        this.getNameCells(name).toggleClass('ordered', !!code);
    }

    clearOrder () {
        this.$thead.find('.asc').removeClass('asc');
        this.$thead.find('.desc').removeClass('desc');
        this.$table.find('.ordered').removeClass('ordered');
    }

    drawTableFrame (data) {
        this.columns = this.grid.getVisibleColumns();
        this.$thead.html(this.renderHead());
        this.$tfoot.html(this.renderFooter());
    }

    drawBody (data) {
        this.$tbody.html(this.renderBody(data));
        Ant.DateHelper.resolveClientDate(this.$tbody);
    }

    renderBody (data) {
        return data.map(row => this.renderBodyRow(row)).join('');
    }

    renderBodyRow (data) {
        if (!data) {
            return '';
        }
        let content = '';
        for (let column of this.columns) {
            content += this.renderBodyCell(data, column);
        }
        return this.renderBodyRowHtml(this.params.getRowId(data), content, data);
    }

    renderBodyRowHtml (id, content) {
        return `<tr data-id="${id}">${content}</tr>`;
    }

    renderBodyCell (data, column) {
        let value = column.render(data[column.name], column, data);
        let cssClass = this.grid.getOrderDirection(column.name) ? 'ordered' : '';
        return this.renderBodyCellHtml(value, column, cssClass, data);
    }

    renderBodyCellHtml (value, column, cssClass) {
        value = column.render(value, column, this);
        return `<td class="${cssClass}" data-name="${column.name}">${value}</td>`;
    }

    renderCellValue (value) {
        return value;
    }

    // HEAD

    renderHead () {
        return this.createHeadByMatrix(this.createHeadMatrix(this.columns));
    }

    renderHeadColumn (column, col, row) {
        let name = column.name;
        let cssClass = 'column';
        if (this.grid.isSortableColumn(name)) {
            let code = this.getDirectionCode(this.grid.getOrderDirection(name));
            cssClass += ' sortable '+ code;
        }
        let label = this.grid.translate(column.label || name);
        return '<th class="'+ cssClass +'" rowspan="'+ row +'" data-name="'+ name +'">'
            + '<span class="column-label search-toggle" title="'+ name +'">'+ label +'</span>'
            + '<span class="order-toggle fa" title="'+ this.locale.orderToggle +'"></span></th>';
    }

    renderHeadGroup (group, col, row) {
        let label = this.grid.translate(group.label || group.name);
        return `<th class="group" colspan="${col}" rowspan="${row}" data-name="${group.name}">${label}</th>`;
    }

    createHeadMatrix (columns) {
        this.setGroupLevels(columns);
        let matrix = [columns];
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
        for (let column of columns) {
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
            result += '<tr>'+ this.createHeadRowByMatrix(y, matrix) +'</tr>';
        }
        return result;
    }

    createHeadRowByMatrix (y, matrix) {
        let result = '';
        for (let x = 0; x < matrix[0].length; ++x) {
            let cell = matrix[y][x], colSpan = 1, rowSpan = 1;
            if (matrix[y][x - 1] === cell || (matrix[y + 1] && matrix[y + 1][x] === cell)) {
                continue;
            }
            while (matrix[y][x + colSpan] === cell) {
                colSpan += 1;
            }
            while (matrix[y - rowSpan] && matrix[y - rowSpan][x] === cell) {
                rowSpan += 1;
            }
            result += cell._isGroup
                ? this.params.renderHeadGroup(cell, colSpan, rowSpan)
                : this.params.renderHeadColumn(cell, colSpan, rowSpan);
        }
        return result;
    }

    // FOOTER

    renderFooter () {
        return '';
    }
};