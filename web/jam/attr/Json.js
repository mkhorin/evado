/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
Jam.JsonModelAttr = class JsonModelAttr extends Jam.ModelAttr {

    activate () {
        if (this.canActivate()) {
            this.$editor = this.find('.json-editor');
            this.$text = this.$editor.find('textarea');
            this.$attr.on('click', '[data-command="edit"]', this.onEdit.bind(this));
            this.$editor.on('shown.bs.modal', this.onShownModal.bind(this));
            this.$editor.on('click', '[data-command="save"]', this.onSave.bind(this));
            this.activated = true;
        }
    }

    onEdit () {
        if (this.isDisabled()) {
            return false;
        }
        this.toggleError(false);
        let value = this.$value.val();
        try {
            value = value ? JSON.stringify(JSON.parse(value), null, 2) : value;
            this.$text.val(value);
        } catch (err) {
            this.$text.val(this.$value.val());
            this.parseError(err);
        }
        this.modal = Jam.showModal(this.$editor);
    }

    onShownModal () {
        this.$text.focus();
    }

    onSave () {
        const value = this.$text.val();
        try {
            if (value) {
                this.$value.val(JSON.stringify(JSON.parse(value), null, 1)).change();
            }
            this.modal.hide();
        } catch (err) {
            this.parseError(err);
        }
    }

    parseError (data) {
        const message = data.toString();
        let pos = Number(message.split(' ').pop());
        if (!isNaN(pos)) {
            const text = this.$text.focus().get(0);
            text.setSelectionRange(pos, pos);
            pos = (pos - (pos % text.cols)) / text.cols;
            text.scrollTop = pos * (text.clientHeight / text.rows);
        }
        this.toggleError(true, message);
    }

    toggleError (state, message) {
        this.$editor.find('.alert').text(message);
        this.$editor.toggleClass('has-error', state);
    }
};