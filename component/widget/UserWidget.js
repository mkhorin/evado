/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('areto/view/Widget');

module.exports = class UserWidget extends Base {

    execute () {
        return this.renderTemplate('_widget/user', {
            roles: this.controller.user.getAssignmentTitles(), 
            changePasswordUrl: this.module.getParam('changePasswordUrl'), 
            enablePasswordChange: this.module.getParam('enablePasswordChange')
        });
    }
};