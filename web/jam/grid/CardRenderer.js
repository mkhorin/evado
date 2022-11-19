/**
 * @copyright Copyright (c) 2021 Maxim Khorin <maksimovichu@gmail.com>
 */
Jam.CardGridRenderer = class CardGridRenderer extends Jam.DataGridRenderer {

    renderContainer () {
        return `<div class="data-grid-cards"><div class="data-grid-body"></div>`
          + `<div class="data-grid-placeholder">${Jam.t('[no data]')}</div></div>`;
    }

    renderBodyItemHtml (id, content) {
        const parity = this.toggleParity() ? 'odd' : 'even';
        return `<div class="data-grid-card data-item ${parity}" data-id="${id}">${content}</div>`;
    }

    renderBodyCell (data, column) {
        if (column.hideEmpty && !data[column.name]) {
            return '';
        }
        return super.renderBodyCell(...arguments);
    }

    renderBodyCellHtml (value, {name, label, hint, translate}) {
        const css = this.getBodyCellClass(...arguments);
        label = Jam.escape(Jam.t(label || name, translate));
        hint = hint ? `title="${Jam.escape(Jam.t(hint, translate))}"` : '';
        return `<div class="card-row row ${css}" data-name="${name}">`
            + `<label class="card-label col-xl-2 col-lg-3" ${hint}>${label}</label>`
            + `<div class="col-xl-10 col-lg-9"><div class="value">${value}</div>`
            + `</div></div>`;
    }

    renderHead () {
        return '';
    }

    renderHeadColumn () {
        return '';
    }

    renderHeadGroup () {
        return '';
    }

    renderBodyGroupHtml (value, {name, label, translate}) {
        const direction = this._groupDirection;
        const sort = '<span class="order-toggle fa" title="Sort"></span>';
        label = Jam.escape(Jam.t(label || name, translate));
        return `<div class="data-grid-card-group ${direction}" title="${label}">${value}${sort}</div>`;
    }
};