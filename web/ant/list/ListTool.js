'use strict';

Ant.ListTool = class {

    static create ($item, owner) {
        switch ($item.data('type')) {
            case 'history': 
                return new Ant.ListTool.History($item, owner);
            default: 
                return new Ant.ListTool.Button($item, owner);
        }
    }

    constructor ($item, owner) {
        this.owner = owner;
        this.$item = $item;
        this.init();
    }

    init () {}

    toggleLoader (state) {
        this.owner.toggleLoader(state);
    }

    getNotice () {
        return this.owner.notice;
    }

    post (url, data) {
        return this.owner.post(url, data);
    }

    loadModal (url, params) {
        this.owner.loadModal(url, params, (event, data)=> {
            if (data && data.result) {
                this.owner.notice.success(data.result);
                this.owner.reload(true);
            }
        });
    }
};

Ant.ListTool.Button = class extends Ant.ListTool {

    init () {
        super.init();
        this.$item.click(this.execute.bind(this));
    }

    execute (event) {
        if (this.$item.data('id') === 'postAction') {
            return this.postAction(event);
        }
        if (this.$item.data('post')) {
            return this.post(this.$item.data('post')).done(data => {
                this.getNotice().success(data);
            });
        }
        this.loadModal(this.$item.data('url'));
    }

    postAction (event) {
        this.getNotice().hide();
        this.$item.attr('disabled', true);
        Ant.postAction(this.$item).done(data => {
            this.getNotice().success(data);
        }).fail(xhr => {
            xhr && this.getNotice().danger(`${xhr.statusText} ${xhr.responseText}`);
        }).always(()=> {
            this.$item.removeAttr('disabled');
        });
    }
};

Ant.ListTool.History = class extends Ant.ListTool.Button {

    execute ($elem) {
        let rows = this.owner.getSelectedRows();
        if (!rows) {
            return this.getCallout().info('Select values to restore');
        }
        if (rows.data().length > 1 && this.isAmbiguousHistory(rows)) {
            return this.getCallout().warning('Can not restore ambiguous values');
        }
        if (Ant.Helper.confirm('Restore selected values?')) {
            this.post($elem.data('url'), {
                'ids': this.list.serializeObjectIds(rows)
            }).done(data => {
                this.list.modal.close(data);
            });
        }
    }

    // check ambiguous selection - equals object id, class, attr
    isAmbiguousHistory (rows) {
        rows = rows.data();
        for (let i = 0; i < rows.length; ++i) {
            for (let j = i + 1; j < rows.length; ++j) {
                if (rows[i].oid === rows[j].oid
                    && rows[i].attr === rows[j].attr
                    && rows[i].class === rows[j].class) {
                    return true;
                }
            }
        }
        return false;
    }
};