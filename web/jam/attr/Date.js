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
            this.$picker.datetimepicker({
                ...$.fn.datetimepicker.defaultOptions,
                ...options
            });
            this.picker = this.$picker.data('DateTimePicker');
            this.$picker.on('dp.change', this.onChangeDate.bind(this));
        } catch (err) {
            console.error(err);
        }
    }

    getDefaultDate (value) {
        return value
            ? new Date(this.utc ? value.slice(0, -1) : value)
            : null;
    }

    getFormat (options) {
        if (this.params.dateFormat) {
            return this.params.dateFormat;
        }
        const format = options.format || this.params.format || 'date';
        return Jam.DateHelper.getMomentFormat(format);
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