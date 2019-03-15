'use strict';

Ant.ModelError = class {

    constructor (model) {
        this.model = model;
        this.modal = model.modal;
        this.notice = model.notice;
        this.$form = model.$form;
    }

    parse (data) {
        this.$form.find('.has-error').removeClass('has-error');
        this.$form.find('.has-group-error').removeClass('has-group-error');
        let errors = {
            all: '',
            unassigned: ''
        };
        if (typeof data === 'string') {
            return this.notice.danger(data);
        }
        if (!data || !Object.values(data).length) {
            return this.notice.danger(data || this.model.translate('Action failed'));
        }
        let $errorAttrs = this.process(data, errors).eq(0);
        if (errors.unassigned) {
            return this.notice.danger(errors.unassigned);
        }
        let top = 0;
        if ($errorAttrs.length && $errorAttrs.is(':visible')) {
            this.modal.scrollTo($errorAttrs);
        } else {
            this.notice.danger(this.model.translate('Correct the mistakes'));
        }
    }

    process (data, errors) {
        for (let className of Object.keys(data)) {
            for (let attrName of Object.keys(data[className])) {
                this.processOne(className, attrName, data[className][attrName], errors);
            }
        }
        let $errorAttrs = this.$form.find('.has-error');
        $errorAttrs.parents('.form-base-group').addClass('has-group-error');
        this.$form.find('.tab-pane.has-group-error').each((index, element)=> {
            let $pane = $(element);
            $pane.closest('.form-tabs').find(`> .nav-tabs [data-id="${$pane.data('id')}"]`)
                .addClass('has-group-error');
        });
        return $errorAttrs;
    }

    processOne (className, attrName, message, errors) {
        errors.all += `<p>${attrName}: ${message}</p>`;
        let attr = this.model.getAttrByName(attrName, className);
        if (attr) {
            attr.$attr.addClass('has-error').find('.error-block').html(message);
        } else {
            errors.unassigned += `<p>${attrName}: ${message}</p>`;
        }
    }
};