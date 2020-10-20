/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

if ($.fn.select2) {    
    $.extend($.fn.select2.defaults.defaults, {
        width: '100%',
        allowClear: true,
        placeholder: '---',
        minimumResultsForSearch: 8
    });
    const $document = $(document.body);
    // prevent open dropdown to clear
    $document.on('select2:unselecting', '.select2-hidden-accessible', event => {
        $(event.target).data('unselecting', true);
    });
    $document.on('select2:opening', '.select2-hidden-accessible', event => {
        if ($(event.target).data('unselecting')) {
            $(event.target).removeData('unselecting');
            event.preventDefault();
        }
    });
}

if ($.fn.datepicker) {
    $.extend($.fn.datepicker.defaults, {
        autoclose: true,
        format: 'yyyy-mm-dd',
        clearBtn: true,
        todayHighlight: true
    });
}

if ($.fn.datetimepicker) {
    $.fn.datetimepicker.defaultOptions = {
        sideBySide: true,
        showClear: true,
        showClose: true,
        ignoreReadonly: false,
        useCurrent: false,
        toolbarPlacement: 'bottom',
        widgetPositioning: {
            vertical: 'bottom'
        },
        // widgetParent: 'body',
        // debug: true
    };
}