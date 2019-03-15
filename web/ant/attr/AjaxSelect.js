'use strict';

Ant.ModelAttr.AjaxSelect = class extends Ant.ModelAttr {

    init () {
        super.init();
        this.params = this.$value.data('params');
        this.xhr = null;
        this.event = new Ant.Event(this.constructor.name);
        this.defaultValue = this.$value.val();
        this.select2 = this.$attr.data('select2');
        this.$select = this.$attr.find('select');
        this.$select.change(this.changeSelect.bind(this));
        setTimeout(this.initDepends.bind(this), 0); // after create all Ant.ModelAttr
    }

    initDepends () {
        for (let item of this.params.depends) {
            item.$value = this.model.getValueFieldByName(item.id);
            item.$value.change(this.changeDepends.bind(this));
            item.attr = Ant.ModelAttr.get(item.$value);
        }
        this.ajaxDepends = this.params.depends.filter(item => item.attr.getType() === 'ajaxSelect');
        this.ajaxDepends.length
            ? this.changeDepends()
            : this.resolveData();
    }

    changeSelect () {
        this.$value.val(this.$select.val()).change();
    }

    changeDepends () {
        if (this.pending) {
            return true;
        }
        this.pending = true;
        setTimeout(()=> {
            async.each(this.ajaxDepends, (item, cb)=> {
                item.attr.pending ? item.attr.event.one('load', cb) : cb();
            }, this.resolveData.bind(this));
        }, 0);
    }

    abort () {
        if (this.xhr) {
            this.xhr.abort();
        }
        this.xhr = null;
        this.pending = false;
    }

    resolveData () {
        this.abort();
        let data = this.getRequestData();
        if (!data) {
            return this.setData([]);
        }
        this.pending = true;
        this.xhr = $.get(this.params.url, data).always(()=> {
            this.abort();
        }).done(this.setData.bind(this));
    }

    getRequestData () {
        let data = {};
        for (let item of this.params.depends) {
            let value = item.attr.getValue();
            if (!item.allowEmpty && (value === '' || value === null || value === undefined)) {
                return false;
            }
            data[item.param] = value;
        }
        return data;
    }

    setData (data) {
        this.$select.html(Ant.Helper.renderSelectOptions({
            'items': data,
            'defaultValue': this.defaultValue,
            'hasEmpty': this.params.hasEmpty,
            'emptyText': this.params.emptyText
        }));
        if (this.select2) {
            this.$select.select2(this.select2);
        }
        this.$select.change();
        this.event.trigger('load');
    }
};