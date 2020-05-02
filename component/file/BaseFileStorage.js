/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('areto/base/Component');

module.exports = class BaseFileStorage extends Base {

    constructor (config) {
        super({
            // maxTotalUserFileSize: 100 * 1024 * 1024, // bytes
            // maxTotalUserFiles: 2,
            ...config
        });
    }

    upload () {
        return this.uploader.execute(...arguments);
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