/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
Jam.DataGridRenderer = class DataGridRenderer {

    constructor (grid) {
        this.grid = grid;
        this.params = grid.params;
        Jam.ObjectHelper.assignUndefined(this.params, this.getDefaultParams());
        this.locale = this.params.locale;
        this.$content = grid.$container.find('.data-grid-content');
        this.init();
    }

    getDefaultParams () {
        return {
            getItemId: this.getItemId.bind(this),
            renderBodyItem: this.renderBodyItem.bind(this),
            renderBodyCell: this.renderBodyCell.bind(this),
            renderHeadColumn: this.renderHeadColumn.bind(this),
            renderHeadGroup: this.renderHeadGroup.bind(this),
        };
    }

    init () {
        this.createContainer();
        this.prepareColumns();
    }

    createContainer () {
        this.$content.append(this.renderContainer());
        this.$head = this.$content.find('.data-grid-head');
        this.$body = this.$content.find('.data-grid-body');
        this.$footer = this.$content.find('.data-grid-footer');
    }

    renderContainer () {
        return '<div class="table-responsive"><table class="data-grid-table table table-bordered">'
            + '<thead class="data-grid-head"></thead><tbody class="data-grid-body"></tbody></table></div>';
    }

    prepareColumns () {
        for (const column of this.params.columns) {
            if (typeof column.render !== 'function') {
                column.render = this.defaultValueRender.bind(this);
            }
        }
    }

    findHeadByName (name) {
        return this.$head.find(`[data-name="${name}"]`);
    }

    findItems (selector) {
        return this.$body.children(selector);
    }

    findItemById (id) {
        return this.$body.children(`[data-id="${id}"]`);
    }

    getItemId (data) {
        return this.params.key ? data[this.params.key] : '';
    }

    getDirection ($element) {
        return $element.hasClass('asc') ? 1 : -1;
    }

    getDirectionName (direction) {
        return direction === 1 ? ' asc' : direction === -1 ? ' desc' : '';
    }

    addItemListener (event, handler) {
        this.addBodyListener(event, '.data-item', handler);
    }

    addBodyOrderListener (handler) {
        this.addBodyListener('click', '.order-toggle', handler);
    }

    addHeadOrderListener (handler) {
        this.addHeadListener('click', '.order-toggle', handler);
    }

    addBodyListener () {
        this.$body.on(...arguments);
    }

    addHeadListener () {
        this.$head.on(...arguments);
    }

    addListener () {
        this.$content.on(...arguments);
    }

    toggleOrder ($toggle, direction) {
        const $cell = $toggle.closest('.sortable');
        const code = this.getDirectionName(direction);
        $cell.removeClass('asc').removeClass('desc').addClass(code);
        $toggle.attr('title', this.locale[code]);
    }

    clearOrder () {
        this.$head.find('.asc').removeClass('asc');
        this.$head.find('.desc').removeClass('desc');
        this.$content.find('.ordered').removeClass('ordered');
    }

    setColumns () {
        this.columns = this.grid.getVisibleColumns();
    }

    toggleParity (state) {
        this._parity = state === undefined ? !this._parity : state;
        return this._parity;
    }

    drawHead () {
        this.$head.html(this.renderHead());
    }

    drawFooter () {
        this.$footer.html(this.renderFooter());
    }

    drawBody (data) {
        const content = this.renderBody(data);
        this.$body.html(content);
        this.$body.toggleClass('grouped', !!this._groupName);
        this.$content.toggleClass('empty', !content);
        Jam.DateHelper.resolveClientDate(this.$body);
        Jam.t(this.$body);
        Jam.Helper.createSerialImageLoading(this.$body);
        Jam.Helper.executeSerialImageLoading(this.$body);
    }

    renderBody (data) {
        this._groupName = this.grid.getGroupName();
        this._groupDirection = this.grid.getGroupDirection() === 1 ? 'asc' : 'desc';
        this.toggleParity(false);
        delete this._lastGroupValue;
        return data.map(item => this.renderBodyItem(item)).join('');
    }

    renderBodyItem (data) {
        if (!data) {
            return '';
        }
        let content = '';
        for (let i = 0; i < this.columns.length; ++i) {
            content += this.renderBodyCell(data, this.columns[i], i);
        }
        const id = this.params.getItemId(data);
        const group = this.renderBodyGroup(data);
        const item = this.renderBodyItemHtml(id, content, ...arguments);
        return group + item;
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
        this.toggleParity(true);
        this._lastGroupValue = value;
        return this.renderBodyGroupHtml(value, column);
    }

    renderBodyGroupHtml (value, {name, label, translate}) {
        const direction = this._groupDirection;
        const cols = this.columns.length;
        const sort = '<span class="order-toggle fa" title="Sort"></span>';
        label = Jam.escape(Jam.t(label || name, translate));
        return `<tr class="group ${direction}"><th title="${label}" colspan="${cols}">${value}${sort}</th></tr>`;
    }

    renderBodyItemHtml (id, content) {
        const parity = this.toggleParity() ? 'odd' : 'even';
        return `<tr class="data-item ${parity}" data-id="${id}">${content}</tr>`;
    }

    renderBodyCell (data, column, index) {
        const value = this.renderValue(data, column);
        return this.renderBodyCellHtml(value, column, index);
    }

    renderBodyCellHtml (value, {name}, index) {
        const style = this.getBodyValueStyle(...arguments);
        const css = this.getBodyCellClass(...arguments);
        return `<td class="${css}" data-name="${name}"><div class="value" ${style}>${value}</div></td>`;
    }

    renderValue (data, column) {
        return this.isForbiddenValue(...arguments)
            ? this.renderForbiddenValue(...arguments)
            : column.render(data[column.name], column, data);
    }

    renderForbiddenValue (data, {name}) {
        return Jam.ObjectHelper.has(name, data)
            ? data[name]
            : Jam.FormatHelper.asNoAccess();
    }

    isForbiddenValue ({_forbidden}, {name}) {
        return Array.isArray(_forbidden) && _forbidden.includes(name);
    }

    getBodyCellClass (value, {css, name}) {
        const cellCss = this.grid.getOrderDirection(name) ? ' ordered' : '';
        return css ? `${cellCss} ${css}` : cellCss;
    }

    getBodyValueStyle (value, column) {
        const height = this.getMaxCellHeight(column);
        return height ? `style="max-height: ${height}px"` : '';
    }

    getMaxCellHeight ({maxCellHeight}) {
        return Number.isSafeInteger(maxCellHeight)
            ? maxCellHeight
            : this.params.maxCellHeight;
    }

    defaultValueRender (value) {
        return value;
    }

    renderHead () {
        const matrix = this.createHeadMatrix(this.columns);
        return this.createHeadByMatrix(matrix);
    }

    renderHeadColumn ({name, label, hint, translate}, columns, rows) {
        let css = 'column';
        if (this.grid.isSortableColumn(name)) {
            let direction = this.grid.getOrderDirection(name);
            css += ` sortable ${this.getDirectionName(direction)}`;
        }
        label = Jam.escape(Jam.t(label || name, translate));
        hint = hint ? Jam.escape(Jam.t(hint, translate)) : label;
        return `<th class="${css}" rowspan="${rows}" data-name="${name}">`
            + `<span class="column-label search-toggle" title="${hint}">${label}</span>`
            + `<span class="order-toggle fa" title="${this.locale.orderToggle}"></span></th>`;
    }

    renderHeadGroup ({name, label, translate}, columns, rows) {
        label = Jam.escape(Jam.t(label || name, translate));
        return `<th class="group" colspan="${columns}" rowspan="${rows}" data-name="${name}">${label}</th>`;
    }

    createHeadMatrix (columns) {
        this.setGroupLevels(columns);
        const matrix = [columns];
        for (let x = 0; x < columns.length; ++x) {
            let column = columns[x];
            let group = this.grid.columnGroupMap[column.group];
            while (typeof group === 'object' && group) {
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
            while (typeof group === 'object' && group) {
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

    renderFooter () {
        return '';
    }
};