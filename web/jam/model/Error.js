/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

Jam.ModelError = class ModelError {

    constructor (model) {
        this.model = model;
        this.modal = model.modal;
        this.notice = model.notice;
        this.$form = model.$form;
        this.$form.on('change', '[name]', this.onChangeValue.bind(this));
    }

    onChangeValue (event) {
        $(event.currentTarget).closest('.form-attr').removeClass('has-error');
    }

    parse (data) {
        this.$form.find('.has-error').removeClass('has-error');
        this.$form.find('.has-group-error').removeClass('has-group-error');
        const errors = {
            all: '',
            unassigned: ''
        };
        if (typeof data === 'string') {
            return this.notice.danger(data);
        }
        if (!data || !Object.values(data).length) {
            return this.notice.danger(data || this.model.translate('Action failed'));
        }
        const $errorAttrs = this.process(data, errors).eq(0);
        if (errors.unassigned) {
            return this.notice.danger(errors.unassigned);
        }
        if ($errorAttrs.length && $errorAttrs.is(':visible')) {
            this.modal.scrollTo($errorAttrs);
        } else {
            this.notice.danger(Jam.i18n.translate('Action failed'));
        }
    }

    process (data, errors) {
        for (const className of Object.keys(data)) {
            for (const attrName of Object.keys(data[className])) {
                this.processOne(className, attrName, data[className][attrName], errors);
            }
        }
        const $errorAttrs = this.$form.find('.has-error');
        $errorAttrs.parents('.form-base-group').addClass('has-group-error');
        for (const pane of this.$form.find('.tab-pane.has-group-error')) {
            $(pane).closest('.form-tabs')
                .find(`> .nav-tabs [data-id="${pane.dataset.id}"]`)
                .addClass('has-group-error');
        }
        return $errorAttrs;
    }

    processOne (className, attrName, message, errors) {
        errors.all += `<p>${attrName}: ${message}</p>`;
        const attr = this.model.getAttr(attrName, className);
        if (attr) {
            attr.$attr.addClass('has-error').find('.error-block').html(message);
        } else {
            errors.unassigned += `<p>${attrName}: ${message}</p>`;
        }
    }
};