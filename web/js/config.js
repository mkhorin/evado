'use strict';

if ($.fn.select2) {
    $.extend($.fn.select2.defaults.defaults, {
        'width': '100%',
        'allowClear': true,
        'placeholder': '---',
        'minimumResultsForSearch': 8
    });
}

if ($.fn.datepicker) {
    $.extend($.fn.datepicker.defaults, {
        'autoclose': true,
        'format': 'yyyy-mm-dd',
        'clearBtn': true,
        'todayHighlight': true
    });
}

if ($.fn.datetimepicker) {
    $.fn.datetimepicker.defaultOptions = {
        'sideBySide': true,
        'showClear': true,
        'showClose': true,
        'ignoreReadonly': false,
        'useCurrent': false,
        'toolbarPlacement': 'bottom',
        // 'widgetParent': 'body',
        // 'debug': true
    };
}

if ($.fn.dataTable) {
    $.extend($.fn.dataTable.defaults, {
        "paging": true,
        "lengthChange": true,
        "searching": true,
        "ordering": true,
        "info": true,
        "autoWidth": false,
        "language": {
            "paginate": {
                "first": "<<",
                "previous": "<",
                "next": ">",
                "last": ">>"
            },
            "lengthMenu": "Show _MENU_"
        }
    });
    // send errors to console instead alert
    $.fn.dataTable.ext.errMode = 'none';
}