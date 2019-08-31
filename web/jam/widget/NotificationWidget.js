/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

Jam.NotificationWidget = class extends Jam.Element {

    init () {
        this.setCounter(this.$element.data('counter'));
        this.$element.on('show.bs.dropdown', this.onShowDropdown.bind(this));
        this.$messages = this.$element.find('.messages');
        this.$messages.on('click', 'a', this.onMenuItem.bind(this));
        this._url = this.$element.data('url');
        this._task = Jam.serverPolling.add({
            period: this.$element.data('period'),
            url: this._url,
            done: this.onTaskDone.bind(this)
        });
    }

    hasUnread () {
        return this.$element.hasClass('has-unread');
    }

    onShowDropdown (event) {
        if (!this._loaded && this.hasUnread()) {
            this._task.execute();
        }
        return true;
    }

    onTaskDone (data) {
        const {counter, items} = data || {};
        this.setCounter(counter);
        this.drawMenuItems(items);
        this._loaded = true;
    }

    setCounter (value) {
        this.$element.find('.unread-counter').html(value);
        this.$element.toggleClass('has-unread', value > 0);
    }

    drawMenuItems (items) {
        if (Array.isArray(items)) {
            const content = items.map(this.drawMenuItem, this).join('');
            this.$messages.html(content);
        }
    }

    drawMenuItem ({id, title}) {
        const icon = `<i class="far fa-flag text-blue"></i>`;
        return `<li><a href="#" title="${title}" data-id="${id}">${icon} ${title}</a></li>`;
    }

    onMenuItem (event) {
        event.preventDefault();
        Jam.toggleMainLoader(true);
        const message = event.target.dataset.id;
        $.get(this._url, {message}).always(()=> {
            Jam.toggleMainLoader(false);
        }).done(data => {
            this.onTaskDone(data);
            this.showMessage(data);
        });
    }

    showMessage (data) {
        data = data && data.message;
        if (data) {
            Jam.dialog.show(data.content, {
                header: data.header,
                submitText: '',
                cancelText: 'Close',
                strictCancel: true
            });
        }
    }
};