'use strict';

// MODAL LINK

$(document.body).on('click', '.modal-link', function (event) {
    event.preventDefault();
    let url = this.href || $(this).data('url');
    Ant.modal.create().load(url);
});

// MENU

$('.loaded-tree-menu').each(function () {
    let $menu = $(this);
    let $active = $menu.find('.menu-item-btn').filter(function () {
        return this.href === location.href;
    });
    $active.eq(0).parent().addClass('active').parents('.treeview').addClass('active');
});
$('.loadable-tree-menu').each(function () {
    let $menu = $(this);
    $menu.on('click', '.treeview > a', function () {
        let $item = $(this).parent();
        if (!$item.hasClass('loading') && !$item.hasClass('loaded')) {
            $item.addClass('loading');
            $.get($menu.data('url'), {
                id: $item.data('id')
            }).done(data => {
                $item.find('.treeview-menu').html(data);
            }).always(()=> {
                $item.removeClass('loading').addClass('loaded');
            });
        }
    });
});
// show opened treeview-menu
$('.menu-open').children('.treeview-menu').show();
// fix to close nested treeview-menu
$('.tree-menu').on('click', '.treeview', function () {
    let $item = $(this);
    if (!$item.hasClass('menu-open')) {
        $item.children('.treeview-menu').find('.treeview-menu').slideUp();
    }
});

// GROUP

$(document.body).on('click', '.form-set-toggle', function (event) {
    let $group = $(this).closest('.form-set').toggleClass('active');
    $group.data('group') && $group.data('group').update();
    /*
    if (!$group.hasClass('collapsed')) {
        Ant.Model.get($group.data('grouper'). closest('.form')).onAttrParentActive($group);
        // Ant.Model.get($group.closest('.form')).onAttrParentActive($group);
    }//*/
});

// TABS

$(document.body).on('click', '.form-tabs > .nav-tabs a', function (event) {
    event.preventDefault();
    let $nav = $(this).parent();
    let $content = $nav.closest('.tabs').children('.tab-content');
    $nav.parent().children('.active').removeClass('active');
    $content.children('.active').removeClass('active');
    $nav.addClass('active');
    let $group = $content.children(`[data-id="${$nav.data('id')}"]`).addClass('active');
    // Ant.Model.get($nav.closest('.form')).onAttrParentActive($content);
    $group.data('group') && $group.data('group').update();
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

// NAVBAR POST ACTION

$('#main-navbar').on('click', '[data-id="postAction"]', function () {
    let notice = new Ant.ContentNotice;
    notice.hide();
    let $btn = $(this);
    $btn.attr('disabled', true).addClass('loading');
    Ant.postAction($btn).always(()=> {
        $btn.removeAttr('disabled').removeClass('loading');
    }).done(data => {
        notice.success(data || 'Action is done');
    }).fail(xhr => {
        xhr && notice.danger(xhr.responseText || 'Action is fail');
    });
});

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

/*(function () {

    const WIDGET_SELECTOR = '.bootstrap-datetimepicker-widget';

    $(document.body)
        .on('dp.show', '.datepicker', fixPosition)
        .on('dp.show', '.datepicker', toggleTime);
    $(window).resize(fixPosition);

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
})(); //*/