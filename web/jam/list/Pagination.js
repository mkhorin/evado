/**
 * @copyright Copyright (c) 2021 Maxim Khorin <maksimovichu@gmail.com>
 */
Jam.Pagination = class Pagination {

    static PAGE_SIZE_KEY = 'pageSize';

    constructor (list, config) {
        this.list = list;
        this.config = config;
        this.params = config.params;
        this.labels = Object.assign(this.getDefaultLabels(), config.labels);
        this.templates = {};
        this.page = Number(this.params.page) || 0;
        this.pageSize = this.resolvePageSize();
        this.$pagination = config.$pagination;
        this.$pages = config.$pages;
        this.$pages.on('click', 'button', this.onPage.bind(this));
        this.createPageJumper();
        this.createPageSizeSelect();
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

    getDataInterval (total) {
        let start = 0, end = total;
        if (this.pageSize && this.pageSize <= total) {
            start = this.page * this.pageSize;
            end = start + this.pageSize;
        }
        if (end > total) {
            end = total;
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

    onChangePageSize (event, value) {
        this.page = 0;
        this.pageSize = value;
        this.savePageSize();
        this.list.load();
    }

    update () {
        if (this.$pagination.length) {
            const content = this.isHidden() ? '' : this.render();
            this.$pages.html(content);
            const $toggle = this.$pages.find('[data-page]');
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
            this.templates[name] = Jam.Helper.getTemplate(name, this.$pagination);
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
        return this.$pages.find('.gap').length > 0;
    }

    resolvePageSize () {
        const size = parseInt(this.params.pageSize) || 0;
        return this.params.keepPageSize
            ? this.list.getStorageData(this.constructor.PAGE_SIZE_KEY, size)
            : size;
    }

    savePageSize () {
        if (this.params.keepPageSize) {
            this.list.setStorageData(this.constructor.PAGE_SIZE_KEY, this.pageSize);
        }
    }

    createPageJumper () {
        this.pageJumper = new this.params.PageJumper(this.config);
        this.pageJumper.events.on('change', this.onChangePage.bind(this));
    }

    createPageSizeSelect () {
        this.pageSizeSelect = new this.params.PageSizeSelect(this.config, this);
        this.pageSizeSelect.events.on('change', this.onChangePageSize.bind(this));
    }
};