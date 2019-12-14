/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

Jam.JsonModelAttr = class JsonModelAttr extends Jam.ModelAttr {

    init () {
        super.init();
        this.activated = false;
    }

    activate () {
        if (this.canActivate()) {
            this.$editor = this.$attr.find('.json-editor');
            this.$alert = this.$editor.find('.alert');
            this.$text = this.$editor.find('textarea');
            this.$attr.find('.edit').click(this.onEdit.bind(this));
            this.$editor.find('.save').click(this.onSave.bind(this));
            this.activated = true;
        }
    }

    onEdit () {
        if (this.isDisabled()) {
            return false;
        }
        this.$alert.hide();
        this.$text.height(this.getTextHeight());
        let value = this.$value.val();
        try {
            value = value ? JSON.stringify(JSON.parse(value), null, 2) : value;
            this.$text.val(value);
        } catch (err) {
            this.$text.val(this.$value.val());
            this.parseError(err);
        }
        this.$editor.modal();
    }

    onSave () {
        let value = this.$text.val();
        try {
            if (value) {
                value = JSON.stringify(JSON.parse(value)).replace(/,/g, ', ').replace(/":/g, '": ');
                this.$value.val(value).change();
            }
            this.$editor.modal('hide');
        } catch (err) {
            this.parseError(err);
        }
    }

    parseError (err) {
        let pos = Number(err.toString().split(' ').pop());
        if (!isNaN(pos)) {
            const text = this.$text.focus().get(0);
            text.setSelectionRange(pos, pos);
            pos = (pos - (pos % text.cols)) / text.cols;
            text.scrollTop = pos * (text.clientHeight / text.rows);
        }
        this.$alert.text(err).show();
    }

    getTextHeight () {
        let height = $(window).height() - 200;
        height = height < 100 ? 100 : height;
        return height;
    }

    normalizeValue (value) {
        return value && typeof value === 'object' ? JSON.stringify(value) : ''
    }
};