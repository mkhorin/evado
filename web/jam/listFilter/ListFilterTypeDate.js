/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
Jam.ListFilterTypeDate = class ListFilterTypeDate extends Jam.ListFilterType {

    init () {
        super.init();
        this.$picker = this.$container.find('.datepicker');
        this.$picker.datetimepicker({
            ...$.fn.datetimepicker.defaultOptions,
            ...this.filter.params.datepicker,
            format: Jam.DateHelper.getMomentFormat(this.getFormat()),
            widgetParent: this.$picker.parent()
        });
        this.picker = this.$picker.data('DateTimePicker');
        this.$picker.on('dp.change', this.onChangeDate.bind(this));
    }

    getFormat () {
        return this.params.format || 'date';
    }

    onChangeDate (event) {
        let date = event.date;
        let format = this.picker.options().format;
        // if date format then remove time
        date = date && moment(moment(date).format(format), format);
        this.setValue(date ? Jam.DateHelper.stringify(date, this.params.utc) : '');
        if (!date) {
            this.picker.hide();
        }
    }

    changeValue (value) {
        this.picker.date(new Date(value));
    }
};