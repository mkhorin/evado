/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('areto/view/Widget');

module.exports = class UserWidget extends Base {

    run () {
        const roles = this.controller.user.getAssignmentTitles();
        return this.renderTemplate('_widget/user', {roles});
    }
};