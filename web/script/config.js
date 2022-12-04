/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

if ($.fn.select2) {
    $.extend($.fn.select2.defaults.defaults, {
        width: '100%',
        allowClear: true,
        placeholder: '',
        minimumResultsForSearch: 8
    });
    const selector = '.select2-hidden-accessible';
    const key = 'deselecting';
    const $document = $(document.body);
    // prevent open dropdown to clear
    $document.on('select2:unselecting', selector, event => {
        $(event.target).data(key, true);
        $document.find(selector).select2('close');
    });
    $document.on('select2:opening', selector, event => {
        if ($(event.target).data(key)) {
            $(event.target).removeData(key);
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
            vertical: 'bottom' // prevent clipping at the top in scrollable containers
        },
        // widgetParent: 'body',
        // debug: true
    };
}

window.Inputmask?.extendDefaults({
    autoUnmask: true,
    clearIncomplete: true
});