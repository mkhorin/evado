/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
Jam.Notifications = class Notifications extends Jam.Element {

    init () {
        this.setCounter(this.getData('counter'));
        this.$element.on('show.bs.dropdown', this.onShowDropdown.bind(this));
        this.$notifications = this.find('.notifications');
        this.$notifications.on('click', 'a', this.onNotification.bind(this));
        this._url = this.getData('url');
        this._enabledPopup = this.getData('popup');
        this._refresh = Jam.serverPolling.add({
            period: this.getData('period'),
            url: this._url,
            done: this.onRefreshDone.bind(this)
        });
    }

    isOpen () {
        return this.hasClass('open');
    }

    hasUnread () {
        return this.hasClass('has-unread');
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
        this.renderNotifications(items);
        if (this._enabledPopup && !this.isOpen() ) {
            this.resolvePopup(items);
        }
        this._loaded = true;
    }

    setCounter (value) {
        this.find('.unread-notification-counter').html(value);
        this.toggleClass('has-unread', value > 0);
    }

    renderNotifications (items) {
        if (Array.isArray(items)) {
            this.$notifications.html(items.map(this.renderNotification, this).join(''));
        }
    }

    renderNotification (data) {
        return this.resolveTemplate('notification', data);
    }

    onNotification (event) {
        event.preventDefault();
        this.requestNotification(event.target.dataset.id);
    }

    requestNotification (message) {
        Jam.toggleLoader(true);
        return $.get(this._url, {message}).always(() => {
            Jam.toggleLoader(false);
        }).done(data => {
            this.onRefreshDone(data);
            this.showNotification(data);
        });
    }

    showNotification (data) {
        const message = data?.message;
        if (message) {
            Jam.dialog.show(message.text, {
                title: message.subject,
                submitText: false,
                cancelText: 'Close',
                strictCancel: true
            });
        }
    }

    resolvePopup (items) {
        this.$popup = this.$popup || this.createPopup();
        this.togglePopup(false);
        if (items?.length) {
            this.buildPopup(items[0]);
            setTimeout(() => this.togglePopup(true), 500);
        }
    }

    togglePopup (state) {
        this.$popup.toggleClass('open', state);
    }

    createPopup () {
        return this.resolveTemplate('popup')
            .appendTo(document.body)
            .click(this.onPopup.bind(this));
    }

    buildPopup ({id, title}) {
        this.$popup.data('id', id).html(title || '...');
    }

    onPopup () {
        this.requestNotification(this.$popup.data('id'));
    }
};