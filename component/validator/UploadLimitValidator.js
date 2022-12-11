/**
 * @copyright Copyright (c) 2021 Maxim Khorin (maksimovichu@gmail.com)
 */
'use strict';

const Base = require('areto/validator/Validator');

module.exports = class UploadLimitValidator extends Base {

    async validateAttr (attr, model) {
        const {maxTotalUserFileSize, maxTotalUserFiles} = model.getStorage();
        if (!maxTotalUserFileSize && !maxTotalUserFiles) {
            return;
        }
        const creator = model.user.getId();
        const sizes = await model.find({creator}).column('size');
        if (maxTotalUserFiles) {
            if (sizes.length >= maxTotalUserFiles) {
                return model.addError(attr, 'Too many uploaded files');
            }
        }
        const size = model.getSize();
        const total = sizes.reduce((sum, value) => sum + value, size);
        if (maxTotalUserFileSize) {
            if (total >= maxTotalUserFileSize) {
                return model.addError(attr, 'Total file size exceeded');
            }
        }
    }
};