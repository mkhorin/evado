/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

Jam.DataGridPagination = class DataGridPagination {

    constructor (grid) {
        this.grid = grid;
        this.params = grid.params;
        this.locale = grid.locale.pagination;
        this.pageSize = parseInt(this.params.pageSize) || 0;
        this.page = parseInt(this.params.page) || 0;
        this.$pagination = grid.$container.find('.data-grid-pagination');
        this.$pagination.on('click', 'button', this.onClickToggle.bind(this));
        this.$jumper = grid.$container.find('.data-grid-page-jumper');
        this.$jumper.change(this.onChangePage.bind(this));
        this.$pageSize = grid.$container.find('.data-grid-page-size');
        this.$pageSizeSelect = this.$pageSize.find('select');
        this.$pageSizeSelect.change(this.onChangePageSize.bind(this));
        this.createPageSizes();
    }

    isHidden () {
        return !this.pageSize || (this.params.hideOnePagePagination && this.pageSize >= this.getTotalSize());
    }

    isNewPage (page) {
        return page !== this.page && this.checkPage(page);
    }

    checkPage (page) {
        return !isNaN(page) && page >= 0 && page < this.getNumPages();
    }

    getNumPages () {
        return (this.pageSize && Math.ceil(this.getTotalSize() / this.pageSize)) || 1;
    }

    getTotalSize () {
        return this.grid.itemTotalSize;
    }

    getToggle (id) {
        return this.$pagination.find(`[data-id="${id}"]`);
    }

    getDataInterval (totalSize) {
        let start = 0, end = totalSize;
        if (this.pageSize && this.pageSize < totalSize) {
            start = this.page * this.pageSize;
            end = start + this.pageSize;
        }
        return [start, end > totalSize ? totalSize : end];
    }

    setPage (page) {
        page = parseInt(page);
        if (this.isNewPage(page)) {
            this.page = page;
            return true;
        }
    }

    onClickToggle (event) {
        if (this.setPage($(event.currentTarget).blur().data('page'))) {
            this.grid.load();
        }
    }

    onChangePage () {
        this.$jumper.blur();
        if (this.setPage(this.$jumper.val())) {
            this.grid.load();
        }
    }

    onChangePageSize () {
        this.$pageSizeSelect.blur();
        this.page = 0;
        this.pageSize = parseInt(this.$pageSizeSelect.val());
        if (this.params.keepPageSize) {
            this.grid.setStoreData('pageSize', this.pageSize);
        }
        this.grid.load();
    }

    draw () {
        this.$pagination.html(this.isHidden() ? '' : this.render());
        const $toggle = this.$pagination.find('[data-page]');
        this.grid.$container.toggleClass('has-page-toggle', $toggle.length > 0);
        this.drawJumper();
    }

    render () {
        let result = '';
        const numPages = this.getNumPages();
        if (numPages > 1 || !this.params.hideOnePageToggle) {
            result += this.renderDirectionToggle('previous', this.page - 1);
            result += this.renderPages();
            result += this.renderDirectionToggle('next', this.page + 1);
        }
        return `<div class="btn-group">${result}</div>`;
    }

    renderPages () {
        let result = this.renderNumToggle(0);
        let numPages = this.getNumPages();
        if (numPages > 2) {
            let [start, end] = this.getToggleInterval(numPages);
            if (start > 2) {
                result += this.renderEllipsis();
            } else {
                end += start === 0 ? 1 : 0;
                start = 1;
            }
            if (end > numPages - 4) {
                start -= (end === numPages - 1) ? 1 : 0;
                end = numPages - 2;
            }
            for (let page = start; page <= end; ++page) {
                result += this.renderNumToggle(page);
            }
            if (end < numPages - 3) {
                result += this.renderEllipsis();
            }
        }
        if (numPages > 1) {
            result += this.renderNumToggle(numPages - 1);
        }
        return result;
    }

    renderDirectionToggle (name, page) {
        return this.renderToggle(page, this.locale[name], 'direction '+ name);
    }

    renderNumToggle (page) {
        return this.renderToggle(page, page + 1, this.page === page ? 'num active' : 'num');
    }

    renderToggle (page, text, css) {
        return `<button class="btn btn-default ${css}" data-page="${page}"><span>${text}</span></button>`;
    }

    renderEllipsis () {
        return `<span class="ellipsis"></span>`;
    }

    getToggleInterval (numPages) {
        let start = 0;
        let end = numPages - 1;
        let max = this.params.maxPageToggles;
        let diff = numPages - max;
        if (diff <= 0) {
            return [start, end];
        }
        let offset = Math.floor((max - 1) / 2) - 1;
        if (offset < 0) {
            offset = 0;
        }
        let rest = max % 2 ? 0 : 1;
        start = this.page - offset - rest;
        end = this.page + offset;
        if (start < 2) {
            end -= start - 1;
            start = 0;
        }
        if (end > numPages - 3) {
            start -= end - numPages + 2;
            end = numPages - 1;
        }
        return [start, end];
    }

    // JUMPER

    drawJumper () {
        const numPages = this.getNumPages();
        if (!this.$jumper.length || numPages <= this.params.maxPageToggles) {
            return this.$jumper.addClass('hidden');
        }
        this.$jumper.html(this.renderJumper(numPages));
        this.$jumper.val(this.page).removeClass('hidden');
    }

    renderJumper (numPages) {
        let result = '';
        for (let i = 0 ; i < numPages; ++i) {
            result += `<option value="${i}">${i + 1}</option>`;
        }
        return result;
    }

    // SIZES

    createPageSizes () {
        if (this.$pageSize.length && Array.isArray(this.params.pageSizes)) {
            if (this.params.keepPageSize) {
                this.pageSize = this.grid.getStoreData('pageSize', this.pageSize);
            }
            const sizes = this.params.pageSizes.map(this.renderPageSize, this).join('');
            this.$pageSizeSelect.html(sizes).val(this.pageSize);
            this.$pageSize.removeClass('hidden');
        }
    }

    renderPageSize (size) {
        return `<option value="${size}">${size}</option>`;
    }
};