'use strict';

const Base = require('../../helper/SelectHelper');

module.exports = class MetaSelectHelper extends Base {

    static getCaptionItems (items) {
        return this.getItems(items, {
            'getItemText': this.getCaptionText,
            'valueKey': 'name'
        });
    }

    static getCaptionText (doc, data) {
        return doc.data.caption ? `${doc.name} - ${doc.data.caption}` : doc.name;
    }

};