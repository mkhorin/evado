/**
 * @copyright Copyright (c) 2021 Maxim Khorin <maksimovichu@gmail.com>
 */
Jam.CardDataGridRenderer = class CardDataGridRenderer extends Jam.DataGridRenderer {

    renderContainer () {
        return `<div class="data-grid-cards"><div class="data-grid-body"></div><div class="data-grid-placeholder">[${Jam.t('no data')}]</div></div>`;
    }

    renderBodyItemHtml (id, content) {
        return `<div class="data-grid-card data-item" data-id="${id}">${content}</div>`;
    }

    renderBodyCellHtml (value, {label, name, hint, translate}) {
        const css = this.getBodyCellClass(...arguments);
        label = Jam.t(label || name, translate);
        hint = hint ? `title="${Jam.t(hint, translate)}"` : '';
        return `<div class="card-row ${css} row" data-name="${name}"><label class="card-label col-xl-2 col-lg-3" ${hint}>${label}</label><div class="col-xl-10 col-lg-9"><div class="value">${value}</div></div></div>`;
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

    renderBodyGroupHtml () {
        return '';
    }
};