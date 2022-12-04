/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
Jam.ModelError = class ModelError {

    constructor (model) {
        this.model = model;
        this.frame = model.frame;
        this.alert = model.alert;
        this.$form = model.$form;
        this.$form.on('change', '[name]', this.onChangeValue.bind(this));
    }

    onChangeValue (event) {
        $(event.currentTarget).closest('.form-attr').removeClass('has-error');
    }

    parseXhr (data) {
        this.parse(data.responseJSON || data.responseText);
    }

    parse (data) {
        this.$form.find('.has-error').removeClass('has-error');
        this.$form.find('.has-group-error').removeClass('has-group-error');
        const errors = {
            all: '',
            unassigned: ''
        };
        if (typeof data === 'string') {
            return this.alert.danger(data);
        }
        if (!data || !Object.values(data).length) {
            return this.alert.danger(data || Jam.t('Action failed'));
        }
        const $errorAttrs = this.process(data, errors).eq(0);
        if (errors.unassigned) {
            return this.alert.danger(errors.unassigned);
        }
        if ($errorAttrs.length && $errorAttrs.is(':visible')) {
            this.frame.scrollTo($errorAttrs);
        } else {
            this.alert.danger(Jam.t('Action failed'));
        }
    }

    process (data, errors) {
        for (const className of Object.keys(data)) {
            for (const attrName of Object.keys(data[className])) {
                const message = data[className][attrName];
                this.processOne(className, attrName, message, errors);
            }
        }
        const $errorAttrs = this.$form.find('.has-error');
        $errorAttrs.parents('.model-group').addClass('has-group-error');
        for (const pane of this.$form.find('.tab-pane.has-group-error')) {
            $(pane).closest('.form-tabs')
                .children('.nav-tabs')
                .find(`[data-id="${pane.dataset.id}"]`)
                .addClass('has-group-error');
        }
        return $errorAttrs;
    }

    processOne (className, attrName, message, errors) {
        let attr = this.model.getAttr(attrName, className);
        let category = Array.isArray(message) ? message[2] : null;
        if (attr) {
            let $block = attr.$attr.addClass('has-error').find('.error-block');
            if (category === undefined || category === null) {
                category = $block?.data('t');
            }
            message = Jam.t(message, category);
            $block.html(message);
        } else {
            message = Jam.t(message, category);
            errors.unassigned += `<p>${attrName}: ${message}</p>`;
        }
        errors.all += `<p>${attrName}: ${message}</p>`;
    }
};