/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('areto/view/Widget');

module.exports = class UserWidget extends Base {

    run () {
        return this.renderTemplate('_widget/user', {});
    }
};