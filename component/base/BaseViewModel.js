/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('areto/view/ViewModel');

module.exports = class BaseViewModel extends Base {

    setModelRelationLink (name, url, model) {
        let related = model.rel(name), value;
        if (Array.isArray(related)) {
            value = related.map(model => this.formatModalLink(url, model.getId(), model.getTitle()));
        } else if (related) {
            value = this.formatModalLink(url, related.getId(), related.getTitle());
        } else {
            value = model.get(name);
        }
        if (value) {
            model.setViewAttr(name, value);
        }
    }

    formatModalLink (url, id, text) {
        url = this.controller.createUrl([url, {id}]);
        return this.controller.format(url, 'modalLink', {text});
    }
};
module.exports.init();
