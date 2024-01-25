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
        return this.params.dateFormat || 'LT';
    }

    onChangeDate (event) {
        const {date} = event;
        const format = 'HH:mm:ss';
        const value = date
            ? moment.duration(moment(date).format(format), format).asSeconds()
            : '';
        this.$value.val(value);
        this.triggerChange();
    }

    setValue (value) {
        super.setValue(this.getDateByTime(value));
    }

    getDateByTime (seconds) {
        seconds = parseInt(seconds);
        if (isNaN(seconds)) {
            return null;
        }
        const duration = moment.duration({s: seconds});
        return moment().startOf('day').add(duration).toDate();
    }
};