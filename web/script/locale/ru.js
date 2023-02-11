/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

if (Jam.DataGrid) {
    Object.assign(Jam.DataGrid.defaults.locale, {
        orderToggle: 'Сортировать',
        searchToggle: 'Искать',
        asc: 'По возрастанию',
        desc: 'По убыванию',
        info: 'Записи с #{START} до #{END} из #{TOTAL}',
        infoEmpty: 'Записей не найдено',
        infoFiltered: '(отфильтровано из #{MAX} записей)'
    });
}

if ($.fn.select2) {
    $.fn.select2.defaults.set('language', 'ru');
}

if ($.fn.datepicker) {
    Object.assign($.fn.datepicker.dates['ru'], {
        clear: 'Очистить'
    });
    Object.assign($.fn.datepicker.defaults, {
        language: 'ru'
    });
}

if ($.fn.datetimepicker) {
    Object.assign($.fn.datetimepicker.defaultOptions, {
        locale: 'ru'
    });
}

if ($.fn.daterangepicker && typeof moment === 'function') {
    $('.daterange').daterangepicker({
        locale: {
            format: 'YYYY-MM-DD',
            applylabel: 'выбрать',
            cancellabel: 'отменить',
            fromlabel: 'с',
            tolabel: 'по',
            customrangelabel: 'указать период',
            daysofweek: ['вс', 'пн', 'вт', 'ср', 'чт', 'пт', 'сб'],
            monthnames: ['январь', 'февраль', 'март', 'апрель', 'май', 'июнь', 'июль', 'август', 'сентябрь', 'октябрь', 'ноябрь', 'декабрь'],
            firstday: 1
        },
        ranges: {
            'сегодня': [moment(), moment()],
            'вчера': [moment().subtract(1, 'days'), moment().subtract(1, 'days')],
            'последние 7 дней': [moment().subtract(6, 'days'), moment()],
            'последние 30 дней': [moment().subtract(29, 'days'), moment()],
            'текущий месяц': [moment().startof('month'), moment().endof('month')],
            'предыдущий месяц': [
                moment().subtract(1, 'month').startof('month'),
                moment().subtract(1, 'month').endof('month')
            ]
        },
        startdate: moment().subtract(29, 'days'),
        enddate: moment()
    }, (start, end) => {
        console.log(`Select: ${start.format('D MMMM YYYY')} - ${end.format('D MMMM YYYY')}`);
    });
}