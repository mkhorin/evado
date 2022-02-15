/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
Jam.DateHelper = class DateHelper {

    static isValid (date) {
        if (!date) {
            return false;
        }
        date = date instanceof Date ? date : new Date(date);
        return !isNaN(date.getTime());
    }

    static stringify (date, absolute) {
        return (absolute ? moment(date).utcOffset(0, true) : moment.utc(date)).format();
    }

    /**
     * If UTC then delete Z suffix
     */
    static formatByUtc (isoDate, utc) {
        return utc && typeof isoDate === 'string' ? isoDate.slice(0, -1) : isoDate;
    }

    static resolveClientDate ($container) {
        for (const item of $container.find('time[data-format]')) {
            const $item = $(item);
            const format = $item.attr('data-format');
            if (format) {
                const date = this.formatByUtc($item.attr('datetime'), $item.data('utc'));
                $item.html(moment(date).format(this.getMomentFormat(format)));
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