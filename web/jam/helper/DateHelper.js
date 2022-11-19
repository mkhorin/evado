/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
Jam.DateHelper = class DateHelper {

    static isValid (date) {
        if (!date) {
            return false;
        }
        if (!(date instanceof Date)) {
            date = new Date(date);
        }
        return !isNaN(date.getTime());
    }

    static stringify (date, absolute) {
        date = absolute
            ? moment(date).utcOffset(0, true)
            : moment.utc(date);
        return date.format();
    }

    /**
     * If UTC then delete Z suffix
     */
    static formatByUtc (isoDate, utc) {
        return typeof isoDate === 'string' && utc
            ? isoDate.slice(0, -1)
            : isoDate;
    }

    static resolveClientDate ($container) {
        for (const item of $container.find('time[data-format]')) {
            const $item = $(item);
            const format = $item.attr('data-format');
            if (format) {
                const utc = $item.data('utc');
                const value = $item.attr('datetime');
                const date = this.formatByUtc(value, utc);
                const momentFormat = this.getMomentFormat(format);
                $item.html(moment(date).format(momentFormat));
            }
            $item.removeAttr('data-format');
        }
    }

    static getMomentFormat (format) {
        switch (format) {
            case 'date': return 'L';
            case 'datetime': return 'L LTS';
            case 'timestamp': return 'L LTS';
        }
        return format;
    }

    static setTimeSelectAfterDay () {
    }
};