/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

Jam.ListTool = class {

    static create ($item, owner) {
        switch ($item.data('type')) {
            case 'history': return new Jam.ListTool.History($item, owner);
            default: return new Jam.ListTool.Button($item, owner);
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
        this.owner.loadModal(url, params, this.onAfterModalClose.bind(this));
    }
    
    onAfterModalClose (event, data) {
        if (data && data.result) {
            this.owner.notice.success(data.result);
            this.owner.reload({resetPage: true});
        }
    }
};

Jam.ListTool.Button = class extends Jam.ListTool {

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
        Jam.UserAction.post(this.$item).done(data => {
            this.getNotice().success(data);
        }).fail(xhr => {
            xhr && this.getNotice().danger(`${xhr.statusText} ${xhr.responseText}`);
        }).always(()=> {
            this.$item.removeAttr('disabled');
        });
    }
};

Jam.ListTool.History = class extends Jam.ListTool.Button {

    execute ($elem) {
        let rows = this.owner.getSelectedRows();
        if (!rows) {
            return this.getCallout().info('Select values to restore');
        }
        if (rows.data().length > 1 && this.isAmbiguousHistory(rows)) {
            return this.getCallout().warning('Can not restore ambiguous values');
        }
        if (Jam.Helper.confirm('Restore selected values?')) {
            this.post($elem.data('url'), {
                ids: this.list.serializeObjectIds(rows)
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