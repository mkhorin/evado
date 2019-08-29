/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('areto/view/Widget');

module.exports = class NotificationToggle extends Base {

    async run () {
        const user = this.controller.user.identity;
        if (!user) {
            return '';
        }
        return this.renderTemplate('_widget/notification-toggle', {
            counter: await user.countNewMessages()
        });
    }
};