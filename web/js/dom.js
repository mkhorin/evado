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

// ACTIONS

(function () {

    let $navBar = $('#main-navbar');

    $navBar.on('click', '[data-action="post"]', executePostAction);
    $navBar.on('click', '[data-action="modal"]', executeModalAction);

    function executePostAction () {
        let $btn = $(this);
        toggleLoader($btn, true);
        Jam.ContentNotice.clear();
        Jam.postAction($btn)
            .always(()=> toggleLoader($btn, false))
            .done(data => afterAction($btn , data))
            .fail(xhr => xhr && notice.danger(xhr.responseText || 'Action is failed'));
    }

    function executeModalAction () {
        let $btn = $(this);
        let modal = Jam.modal.create();
        Jam.ContentNotice.clear();
        modal.load($btn.data('url'), $btn.data('params'));
        modal.one('afterClose', (event, data)=> data.result && afterAction($btn, data.result));
    }

    function afterAction ($btn, data) {
        $btn.data('reloadPage')
            ? location.reload(true)
            : (new Jam.ContentNotice).success(data || 'Action is done');
    }

    function toggleLoader ($btn, state) {
        if ($btn.data('globalLoader')) {
            Jam.toggleGlobalLoading(state);
        } else {
            $btn.toggleClass('loading', state);
            state ? $btn.attr('disabled', true) : $btn.removeAttr('disabled');
        }
    }
})();

// LOADABLE CONTENT

(function () {

    $(document.body).on('click', '[data-loadable-toggle]', function () {
        load($(this).closest('.loadable-container'));
    });

    function load ($container) {
        if ($container.hasClass('loading')) {
            return false;
        }
        let method = $container.data('method') || 'get';
        let $content = $container.addClass('loading').find('.loadable-content');

        return $[method]($container.data('url'), getParams($container))
            .always(()=> $container.addClass('loaded'))
            .done(data => $content.html(data))
            .fail(()=> $content.html(''));
    }

    function getParams ($container) {
        return {
            'url': location.pathname,
            'params': location.search,
            ...$container.data('params')
        };
    }
})();

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