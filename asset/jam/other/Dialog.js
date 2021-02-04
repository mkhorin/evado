/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
Jam.Dialog = class Dialog {

    constructor (params) {
        this.params = {            
            submitText: 'OK',
            cancelText: 'Cancel',
            returnCancel: false,
            strictCancel: false,
            cssClass: 'default',
            beforeSubmit: null,
            ...params
        };
        this.$dialog = $(this.createElement());        
        this.$submit = this.$dialog.find('.btn-submit');
        this.$cancel = this.$dialog.find('.btn-cancel');
        this.$submit.click(this.onAction.bind(this, true));
        this.$cancel.click(this.onAction.bind(this, false));
        this.$dialog.click(this.onContainer.bind(this));
        this.$dialog.keyup(this.onKeyUp.bind(this));
        $(document.body).append(this.$dialog);
    }

    isVisible () {
        return this.$dialog.is(':visible');
    }

    confirmListDeletion (message, data) {
        return this.confirmDeletion(message || 'Delete selected objects permanently?', data);
    }

    confirmDeletion (message, data) {
        return this.confirm(message || 'Delete this object permanently?', {
            submitText: 'Delete',
            cssClass: 'danger',
            ...data
        });
    }

    confirm (message, data) {
        return this.show(message, {
            title: 'Confirmation',
            cssClass: 'warning',
            ...data
        });
    }

    alert (message, data) {
        return this.show(message, {
            title: 'Warning',
            cssClass: 'warning',
            submitText: false,
            cancelText: 'Close',
            returnCancel: true,
            ...data
        });
    }

    error (message, data) {
        return this.show(message, {
            title: 'Error',
            cssClass: 'danger',
            submitText: false,
            cancelText: 'Close',
            returnCancel: true,
            strictCancel: true,
            ...data
        });
    }

    info (message, data) {
        return this.show(message, {
            title: 'Information',
            cancelText: false,
            ...data
        });
    }

    show (message, data) {
        data = {...this.params, ...data};
        data.message = message;
        this.build(data);
        this.$dialog.show();
        if (!data.strictCancel) {
            this.$cancel.focus();
        }
        this._returnCancel = data.returnCancel;
        this._strictCancel = data.strictCancel;
        this._result = $.Deferred();
        this._beforeSubmit = data.beforeSubmit;
        return this._result;
    }

    build (data) {
        this.$dialog.removeClass().addClass(`dialog-${data.cssClass} dialog`);
        this.$dialog.find('.dialog-head').html(Jam.t(data.title));
        this.$dialog.find('.dialog-body').html(Jam.t(data.message));
        this.$submit.html(Jam.t(data.submitText)).toggle(!!data.submitText);
        this.$cancel.html(Jam.t(data.cancelText)).toggle(!!data.cancelText);
    }

    onAction (status) {
        if (status && this._beforeSubmit && !this._beforeSubmit(status)) {
            return false;
        }
        this.execute(status);
    }

    onContainer (event) {
        if (event.target === event.currentTarget && !this._strictCancel) {
            this.onAction(false);
        }
    }

    onKeyUp (event) {
        if (event.keyCode === 27 && !this._strictCancel) {
            this.onAction(false);
        }
    }

    close () {
        this.execute(false);
    }

    submit () {
        this.execute(true);
    }

    execute (status) {
        if (this.isVisible()) {
            this.$dialog.hide();
            if (status || this._returnCancel) {
                this._result.resolve(status);
            }
        }
    }
    
    createElement () {
        return `<div class="dialog"><div class="dialog-box"><div class="dialog-head"></div><div class="dialog-body"></div><div class="dialog-foot"><button class="btn-submit btn" type="button"></button><button class="btn-cancel btn-outline-secondary btn" type="button"></button></div></div></div>`;
    }
};