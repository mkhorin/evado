/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

Jam.NotificationWidget = class NotificationWidget extends Jam.Element {

    init () {
        this.setCounter(this.$element.data('counter'));
        this.$element.on('show.bs.dropdown', this.onShowDropdown.bind(this));
        this.$messages = this.$element.find('.messages');
        this.$messages.on('click', 'a', this.onMenuItem.bind(this));
        this._url = this.$element.data('url');
        this._enabledPopup = this.$element.data('popup');
        this._refresh = Jam.serverPolling.add({
            period: this.$element.data('period'),
            url: this._url,
            done: this.onRefreshDone.bind(this)
        });

    }

    isOpen () {
        return this.$element.hasClass('open');
    }

    hasUnread () {
        return this.$element.hasClass('has-unread');
    }

    onShowDropdown () {
        if (!this._loaded && this.hasUnread()) {
            this._refresh.execute();
        }
        return true;
    }

    onRefreshDone (data) {
        const {counter, items} = data || {};
        this.setCounter(counter);
        this.drawMenuItems(items);
        if (this._enabledPopup && !this.isOpen() ) {
            this.resolvePopup(items);
        }
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
        this.requestMessage(event.target.dataset.id);
    }

    requestMessage (message) {
        Jam.toggleGlobalLoader(true);
        $.get(this._url, {message}).always(() => {
            Jam.toggleGlobalLoader(false);
        }).done(data => {
            this.onRefreshDone(data);
            this.showMessage(data);
        });
    }

    showMessage (data) {
        data = data && data.message;
        if (data) {
            Jam.dialog.show(data.text, {
                title: data.subject,
                submitText: false,
                cancelText: 'Close',
                strictCancel: true
            });
        }
    }

    // POPUP

    resolvePopup (items) {
        this.$popup = this.$popup || this.createPopup();
        this.togglePopup(false);
        if (Array.isArray(items) && items.length) {
            this.buildPopup(items[0]);
            setTimeout(() => this.togglePopup(true), 500);
        }
    }

    togglePopup (state) {
        this.$popup.toggleClass('open', state);
    }

    createPopup () {
        return $(`<div class="notification-popup"></div>`)
            .appendTo(document.body)
            .click(this.onPopup.bind(this));
    }

    buildPopup ({id, title}) {
        this.$popup.data('id', id).html(title || '...');
    }

    onPopup () {
        this.requestMessage(this.$popup.data('id'));
    }
};