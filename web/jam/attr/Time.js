/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
Jam.TimeModelAttr = class TimeModelAttr extends Jam.DateModelAttr {

    constructor () {
        super(...arguments);
        this.utc = false;
    }

    getDefaultDate (value) {
        return this.getDateByTime(value);
    }

    getFormat () {
        return this.params.momentFormat || 'LT';
    }

    onChangeDate (event) {
        const date = event.date;
        const format = 'HH:mm:ss';
        const value = date ? moment.duration(moment(date).format(format), format).asSeconds() : '';
        this.$value.val(value);
        this.triggerChange();
    }

    setValue (value) {
        super.setValue(this.getDateByTime(value));
    }

    getDateByTime (seconds) {
        seconds = parseInt(seconds);
        return isNaN(seconds) ? null : moment().startOf('day').add(moment.duration({s: seconds})).toDate();
    }
};