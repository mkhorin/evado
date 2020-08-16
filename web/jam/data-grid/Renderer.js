/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

Jam.DataGridRenderer = class DataGridRenderer {

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
                column.render = this.defaultCellValueRender.bind(this);
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

    getDirection ($element) {
        return $element.hasClass('asc') ? 1 : -1;
    }

    getDirectionName (direction) {
        return direction === 1 ? ' asc' : direction === -1 ? ' desc' : '';
    }

    toggleOrder ($toggle, direction) {
        const $cell = $toggle.closest('th');
        const name = $cell.data('name');
        const code = this.getDirectionName(direction);
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
        Jam.i18n.translateContainer(this.$tbody);
        Jam.Helper.createSerialImageLoading(this.$tbody);
        Jam.Helper.executeSerialImageLoading(this.$tbody);
    }

    renderBody (data) {
        this._groupName = this.grid.getGroupName();
        this._groupDirection = this.grid.getGroupDirection() === 1 ? 'asc' : 'desc';
        delete this._lastGroupValue;
        return data.map(row => this.renderBodyRow(row)).join('');
    }

    renderBodyRow (data) {
        if (!data) {
            return '';
        }
        let content = '';
        this._rowValueMap = {};
        for (let i = 0; i < this.columns.length; ++i) {
            content += this.renderBodyCell(data, this.columns[i], i);
        }
        const id = this.params.getRowId(data);
        return this.renderBodyGroup(data) + this.renderBodyRowHtml(id, content, ...arguments);
    }

    renderBodyGroup (data) {
        const column = this.grid.getColumn(this._groupName);
        if (!column) {
            return '';
        }
        const value = this.renderValue(data, column);
        if (value === this._lastGroupValue) {
            return '';
        }
        this._lastGroupValue = value;
        return this.renderBodyGroupHtml(value, column);
    }

    renderBodyGroupHtml (value, {name, label, translate}) {
        const direction = this._groupDirection;
        const span = this.columns.length;
        const sort = '<span class="order-toggle fa" title="Sort"></span>';
        label = this.grid.translate(label || name, translate);
        return `<tr class="group ${direction}"><th title="${label}" colspan="${span}">${value}${sort}</th></tr>`;
    }

    renderBodyRowHtml (id, content) {
        return `<tr class="item" data-id="${id}">${content}</tr>`;
    }

    renderBodyCell (data, column, index) {
        const value = this.renderValue(data, column);
        return this.renderBodyCellHtml(value, column, index);
    }

    renderBodyCellHtml (value, column) {
        const height = this.getMaxCellHeight(column);
        const style = height ? `style="max-height: ${height}px"` : '';
        const cell = `<div class="cell" ${style}>${value}</div>`;
        return `<td class="${this.getBodyCellClass(...arguments)}" data-name="${column.name}">${cell}</td>`;
    }

    renderValue (data, column) {
        return !this.isForbiddenValue(data, column)
            ? column.render(data[column.name], column, data)
            : Jam.ObjectHelper.has(column.name, data)
                ? data[column.name]
                : Jam.FormatHelper.asNoAccess();
    }

    isForbiddenValue ({_forbidden}, {name}) {
        return Array.isArray(_forbidden) && _forbidden.includes(name);
    }

    getBodyCellClass (value, column) {
        const cssClass = this.grid.getOrderDirection(column.name) ? ' ordered' : '';
        return column.cssClass ? `${cssClass} ${column.cssClass}` : cssClass;
    }

    getMaxCellHeight (column) {
        return Number.isInteger(column.maxCellHeight) ? column.maxCellHeight : this.params.maxCellHeight;
    }

    defaultCellValueRender (value) {
        return value;
    }

    // HEAD

    renderHead () {
        return this.createHeadByMatrix(this.createHeadMatrix(this.columns));
    }

    renderHeadColumn ({name, label, translate}, columns, rows) {
        let cssClass = 'column';
        if (this.grid.isSortableColumn(name)) {
            cssClass += ' sortable '+ this.getDirectionName(this.grid.getOrderDirection(name));
        }
        label = this.grid.translate(label || name, translate);
        return '<th class="'+ cssClass +'" rowspan="'+ rows +'" data-name="'+ name +'">'
            + '<span class="column-label search-toggle" title="'+ name +'">'+ label +'</span>'
            + '<span class="order-toggle fa" title="'+ this.locale.orderToggle +'"></span></th>';
    }

    renderHeadGroup ({name, label, translate}, columns, rows) {
        label = this.grid.translate(label || name, translate);
        return `<th class="group" colspan="${columns}" rowspan="${rows}" data-name="${name}">${label}</th>`;
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

Jam.TreeGridRenderer = class TreeGridRenderer extends Jam.DataGridRenderer {

    drawNode ($row, items) {
        const depth = parseInt($row.data('depth')) + 1;
        $row.after(items.map(item => this.renderBodyRow(item, depth)).join(''));
    }

    renderBodyRowHtml (id, content, data, depth = 0) {
        const css = data._node_hasChildren ? 'has-children' : '';
        const node = data._node_class || '';
        return `<tr class="item ${css}" data-depth="${depth}" data-id="${id}" data-class="${node}">${content}</tr>`;
    }

    renderBodyCellHtml (value, column, index) {
        if (index === 0) {
            value += this.params.nodeToggle;
        }
        return super.renderBodyCellHtml(value, column, index);
    }
};