/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
Jam.TreeGridRenderer = class TreeGridRenderer extends Jam.DataGridRenderer {

    drawNode ($item, items) {
        const depth = parseInt($item.data('depth')) + 1;
        const content = items.map(item => this.renderBodyItem(item, depth)).join('');
        $item.after(content);
    }

    renderBodyItemHtml (id, content, data, depth = 0) {
        const css = data._node_hasChildren ? 'has-children' : '';
        const node = data._node_class || '';
        return `<tr class="data-item ${css}" data-depth="${depth}" data-id="${id}" data-class="${node}">${content}</tr>`;
    }

    renderBodyCellHtml (value, column, index) {
        if (index === 0) {
            value += this.params.nodeToggle;
        }
        return super.renderBodyCellHtml(value, column, index);
    }
};