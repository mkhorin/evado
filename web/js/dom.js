/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

// MODAL LINK

$(document.body).on('click', '.modal-link', function (event) {
    event.preventDefault();
    let url = this.href || $(this).data('url');
    Jam.modal.create().load(url);
});

// CHECKBOX

$('.checkbox-init').each(function () {
    $(this).find('[type="checkbox"]').change(function () {
        $(this).prev('[type="hidden"]').val(this.checked ? 1 : 0);
    }).change();
});

// CAPTCHA

$('.captcha-refresh').click(function (event) {
    event.preventDefault();
    $(this).prev().attr('src', this.href + Date.now());
});

// DATE TIME PICKER

(function () {    
    const WIDGET_SELECTOR = '.bootstrap-datetimepicker-widget';
/*
    $(document.body)
        .on('dp.show', '.datepicker', fixPosition)
        .on('dp.show', '.datepicker', toggleTime);
    
    $(window).resize(fixPosition);
*/
    function fixPosition (event) {
        let $widget = $(WIDGET_SELECTOR).last();
        if (!$widget.length) {
            return false;
        }
        let $target = $(event.currentTarget);
        let {left, top} = $target.offset();
        if ($widget.hasClass('bottom')) {
            top += $target.outerHeight();
        } else {
            top -= $widget.outerHeight();
        }
        $widget.offset({top, left});
    }

    function toggleTime () {
        $(WIDGET_SELECTOR).find('.day').on('click', ()=> {
            $(WIDGET_SELECTOR).find('[data-action="togglePicker"]').click();
        });
    }
})(); 