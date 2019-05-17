'use strict';

const Base = require('areto/base/Component');

module.exports = class BaseFileStorage extends Base {

    upload (...args) {
        return this.uploader.execute(...args);
    }

    resolvePath (target) {
        return path.isAbsolute(target) ? target : this.module.getPath(target);
    }

    getHeaders (name, mime) {
        return {
            'Content-Disposition': `attachment; filename=${encodeURIComponent(name)}`,
            'Content-Transfer-Encoding': 'binary',
            'Content-Type': mime
        };
    }

    getValidatorRule (attrName) {
        if (this.rule) {
            return [attrName, 'file', this.rule];
        }
    }
};

const path = require('path');