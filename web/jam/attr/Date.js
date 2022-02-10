/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
Jam.DateModelAttr = class DateModelAttr extends Jam.ModelAttr {

    constructor () {
        super(...arguments);
        this.utc = this.getData('utc');
    }

    activate () {
        if (this.canActivate()) {
            this.$picker = this.find('.datepicker');
            if (this.$picker.length) {
                this.createPicker();
            }
            this.activated = true;
        }
    }

    createPicker () {
        try {
            const options = this.params.datepicker || {};
            if (options.minDate) {
                options.minDate = new Date(options.minDate);
            }
            if (options.maxDate) {
                options.maxDate = new Date(options.maxDate);
            }
            options.defaultDate = this.getDefaultDate(this.$value.val());
            options.format = this.getFormat(options);
            options.widgetParent = this.$picker.parent();
            this.$picker.datetimepicker({...$.fn.datetimepicker.defaultOptions, ...options});
            this.picker = this.$picker.data('DateTimePicker');
            this.$picker.on('dp.change', this.onChangeDate.bind(this));
        } catch (err) {
            console.error(err);
        }
    }

    getDefaultDate (value) {
        return !value ? null : this.utc ? new Date(value.slice(0, -1)) : new Date(value);
    }

    getFormat (options) {
        const format = this.params.momentFormat;
        return format || Jam.DateHelper.getMomentFormat(options.format || this.params.format || 'date');
    }

    onChangeDate (event) {
        const date = event.date;
        const format = this.picker.options().format;
        // if date format then remove time
        const value = date ? moment(moment(date).format(format), format) : '';
        this.$value.val(value ? Jam.DateHelper.stringify(value, this.utc) : '');
        this.triggerChange();
        if (!date) {
            this.picker.hide();
        }
    }

    setValue (value) {
        value ? this.picker.date(moment(value)) : this.picker.clear();
    }
};