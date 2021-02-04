/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
Jam.SelectModelAttr = class SelectModelAttr extends Jam.ModelAttr {

    constructor () {
        super(...arguments);
        this.select2Params = this.getData('select2');
        this.depends = this.getData('depends');
        this.$update = this.findByData('action', 'update');
        this.$update.click(this.onUpdate.bind(this));
        this.cache = new Map;
    }

    activate () {
        if (!this.canActivate()) {
            return false;
        }
        if (this.select2Params) {
            this.createSelect2();
        }
        if (this.depends) {
            this.createDependencies();
        }
        this.activated = true;
        this.toggleBlank();
    }

    enable (state) {
        super.enable(state);
        if (this.getSelect2()) {
            this.$value.select2('enable', state ? undefined : false);
        }
    }

    getSelect2 () {
        return this.$value.data('select2');
    }

    getValueText () {
        if (!this.getSelect2()) {
            return this.$value.find('option:selected').text();
        }
        const data = this.$value.select2('data');
        return data.map(item => item.text).join();
    }

    setValue (value) {
        this.$value.val(value).trigger('change.select2');
        this.toggleBlank();
    }

    onUpdate () {
        if (!this.hasValue()) {
            return false;
        }
        const id = this.getValue();
        const url = this.$update.data('url');
        this.$update.data('blank')
            ? Jam.UrlHelper.openNewPage(url + id)
            : Jam.FrameStack.load(this.model.childFrame, url, {id});
    }

    createDependencies () {
        for (const master of this.depends) {
            master.name = master.attr;
            master.$value = this.model.findAttrValueByName(master.name);
            master.attr = Jam.ModelAttr.get(master.$value);
            master.value = master.attr.getValue();
        }
        this.model.events.on('change', this.onChangeModel.bind(this));
    }

    onChangeModel () {
        let changed = false;
        for (const data of this.depends) {
            const value = data.attr.getValue();
            if (data.value !== value) {
                data.value = value;
                changed = true;
            }
        }
        if (changed) {
            setTimeout(this.afterChangeModel.bind(this), 0);
        }
    }

    afterChangeModel () {
        this.$value.val(null);
        if (this.getSelect2()) {
            this.$value.select2('destroy');
        }
        this.triggerChange();
        if (this.select2Params) {
            this.createSelect2();
        }
    }

    createSelect2 () {
        const params = {
            pageSize: 10,
            minimumInputLength: 0,
            maximumInputLength: 24,
            minimumResultsForSearch: 10,
            ...this.select2Params
        };
        if (params.ajax) {
            params.ajax = this.getAjaxParams(params.ajax);
        }
        if (params.hasOwnProperty('translate')) {
            params.placeholder = Jam.t(params.placeholder, params.translate);
        }
        this.select2Params = params;
        this.$value.select2(params).change(this.onChangeSelect.bind(this));
        this.getSelect2().on('query', this.onQuery.bind(this));
    }

    onQuery () {
        if (this.select2Params.ajax) {
            // clear previous search results except Searching... display
            this.getSelect2().$results.find('li:not(:first)').hide();
        }
    }

    onChangeSelect () {
        this.toggleBlank();
    }

    getAjaxParams (params) {
        return {
            type: 'POST',
            dataType: 'json',
            data: this.getQueryData.bind(this),
            processResults: this.processResults.bind(this),
            delay: 500,
            cache: true,
            ...params
        };
    }

    getQueryData (data) {
        return {
            search: data.term,
            page: data.page,
            pageSize: this.select2Params.pageSize,
            ...this.select2Params.queryData,
            ...this.getMasterData()
        };
    }

    getMasterData () {
        const data = {};
        if (Array.isArray(this.depends)) {
            for (const {attr, name, param} of this.depends) {
                data[param || name] = attr.getValue();
            }
        }
        return data;
    }

    processResults (data, params) {
        const items = data.items || data;
        const more = ((params.page || 1) * this.select2Params.pageSize) < data.total;
        return {
            pagination: {more},
            results: Jam.Helper.formatSelectItems(items)
        };
    }
};