/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

Jam.ModelAttr.Select = class extends Jam.ModelAttr {

    constructor () {
        super(...arguments);
        this.select2 = this.$attr.data('select2');
        this.masters = this.$attr.data('masters');
        this.findByData('action', 'update').click(this.onClickUpdate.bind(this));
        this.cache = new Map;
    }

    activate () {
        if (!this.canActivate()) {
            return false;
        }
        if (this.select2) {
            this.createSelect2();
        }
        if (this.masters) {
            this.createDependencies();
        }
        this.activated = true;
    }

    onClickUpdate () {
        if (this.hasValue()) {
           Jam.Modal.load(this.childModal, $(event.currentTarget).data('url'), {id: this.getValue()});
        }
    }

    createDependencies () {
        for (let master of this.masters) {
            master.name = master.attr;
            master.$value = this.model.getValueFieldByName(master.name);
            master.$value.change(this.onChangeMaster.bind(this));
            master.attr = Jam.ModelAttr.get(master.$value);
        }
    }

    onChangeMaster () {
        setTimeout(()=> {
            this.$value.val(null).change().select2('destroy');
            this.createSelect2();
        }, 0);
    }

    createSelect2 () {
        let params = {
            pageSize: 10,
            minimumInputLength: 0,
            maximumInputLength: 24,
            minimumResultsForSearch: 10,
            ...this.select2
        };
        if (params.ajax) {
            params.ajax = this.getAjaxParams(params.ajax);
        }
        this.select2 = params;
        this.$value.select2(params);
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
            pageSize: this.select2.pageSize,
            ...this.select2.queryData,
            ...this.getMasterData()
        };
    }

    getMasterData () {
        let data = {};
        if (Array.isArray(this.masters)) {
            for (let master of this.masters) {
                data[master.param || master.name] = master.attr.getValue();
            }
        }
        return data;
    }

    processResults (data, params) {
        let items = data.items || data;
        let more = ((params.page || 1) * this.select2.pageSize) < data.total;
        return {
            pagination: {more},
            results: items.map(this.processResultItem, this)
        };
    }

    processResultItem (item) {
        if (item.value) {
            item.id = item.value;
        }
        return item;
    }
};