/**
 * @copyright Copyright (c) 2021 Maxim Khorin <maksimovichu@gmail.com>
 */
Jam.Pagination = class Pagination {

    constructor (list, config) {
        this.list = list;
        this.config = config;
        this.params = config.params;
        this.labels = Object.assign(this.getDefaultLabels(), config.labels);
        this.templates = {};
        this.pageSize = parseInt(this.params.pageSize) || 0;
        this.page = parseInt(this.params.page) || 0;
        this.$pager = config.$pager;
        this.$pagination = config.$pagination;
        this.$pagination.on('click', 'button', this.onPage.bind(this));
        this.$pageSize = config.$pageSize;
        this.$pageSizeSelect = this.$pageSize.find('select');
        this.$pageSizeSelect.change(this.onPageSize.bind(this));
        this.createPageJumper();
        this.createPageSizes();
    }

    getDefaultLabels () {
        return {
            first: '<<',
            last: '>>',
            previous: '<',
            next: '>'
        };
    }

    isHidden () {
        if (!this.pageSize) {
            return true;
        }
        return this.params.hideOnePageToggle
            && this.page === 0
            && this.pageSize >= this.getTotalSize();
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
        return this.list.getTotalSize();
    }

    getDataInterval (totalSize) {
        let start = 0, end = totalSize;
        if (this.pageSize && this.pageSize <= totalSize) {
            start = this.page * this.pageSize;
            end = start + this.pageSize;
        }
        if (end > totalSize) {
            end = totalSize;
        }
        return [start, end];
    }

    setPage (page) {
        page = parseInt(page);
        if (this.isNewPage(page)) {
            this.page = page;
            return true;
        }
    }

    onPage (event) {
        const $page = $(event.currentTarget).blur();
        const index = $page.data('page');
        if (this.setPage(index)) {
            this.list.load();
        }
    }

    onChangePage (event, value) {
        if (this.setPage(value)) {
            this.list.load();
        }
    }

    onPageSize () {
        this.$pageSizeSelect.blur();
        this.page = 0;
        this.pageSize = parseInt(this.$pageSizeSelect.val());
        if (this.params.keepPageSize) {
            this.list.setStorageData('pageSize', this.pageSize);
        }
        this.list.load();
    }

    update () {
        if (this.$pager.length) {
            const content = this.isHidden() ? '' : this.render();
            this.$pagination.html(content);
            const $toggle = this.$pagination.find('[data-page]');
            this.list.toggleClass('has-page-toggle', $toggle.length > 0);
            this.pageJumper.update(this.page, this.getNumPages(), this.hasHiddenPages());
        }
    }

    render () {
        let buttons = '';
        let total = this.getNumPages();
        if (total > 1 || this.page > 0) {
            if (this.page > 0) {
                buttons += this.renderDirectionButton('previous', this.page - 1);
            }
            buttons += this.renderButtons();
            if (this.page + 1 < total) {
                buttons += this.renderDirectionButton('next', this.page + 1);
            }
        }
        return this.resolveTemplate('group', {buttons});
    }

    renderDirectionButton (name, page) {
        return this.params.showDirectionPageToggle
            ? this.renderButton(page, this.labels[name], `direction ${name}`)
            : '';
    }

    renderButtons () {
        let result = this.renderPageButton(0);
        let total = this.getNumPages();
        let last = total - 1;
        if (total > 2) {
            let [start, end] = this.getToggleInterval(total);
            if (start > 2) {
                result += this.renderGap();
            } else {
                start = 1;
            }
            if (end === last) {
                end -= 1;
            } else if (end === last - 2) {
                end += 1; // instead of gap
            }
            for (let page = start; page <= end; ++page) {
                result += this.renderPageButton(page);
            }
            if (end < last - 1) {
                result += this.renderGap();
            }
        }
        if (total > 1) {
            result += this.renderPageButton(last);
        }
        return result;
    }

    renderPageButton (page) {
        const css = this.page === page ? 'num active' : 'num';
        return this.renderButton(page, page + 1, css);
    }

    renderButton (page, text, css) {
        return this.resolveTemplate('button', {page, text, css});
    }

    renderGap () {
        return this.resolveTemplate('gap');
    }

    resolveTemplate (name, data) {
        return Jam.Helper.resolveTemplate(this.getTemplate(name), data);
    }

    getTemplate (name) {
        if (!this.templates[name]) {
            this.templates[name] = Jam.Helper.getTemplate(name, this.$pager);
        }
        return this.templates[name];
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

    hasHiddenPages () {
        return this.$pagination.find('.gap').length > 0;
    }

    createPageJumper () {
        this.pageJumper = new Jam.PageJumper(this.config);
        this.pageJumper.events.on('change', this.onChangePage.bind(this));
    }

    createPageSizes () {
        if (this.$pageSize.length && Array.isArray(this.params.pageSizes)) {
            if (this.params.keepPageSize) {
                this.pageSize = this.list.getStorageData('pageSize', this.pageSize);
            }
            const sizes = this.params.pageSizes.map(this.renderPageSize, this);
            this.$pageSizeSelect.html(sizes.join(''));
            this.$pageSizeSelect.val(this.pageSize);
            this.$pageSize.removeClass('hidden');
        }
    }

    renderPageSize (size) {
        return `<option value="${size}">${size}</option>`;
    }
};