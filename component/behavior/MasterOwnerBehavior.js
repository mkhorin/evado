/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('areto/base/Behavior');

// для предотвращения сохранения владельца для создаваемого зависимого объекта
// владелец будет записан при самом его сохранении
// однако до сохранения, владелец, в зависимом объекте, необходим для разрешения других связей

module.exports = class MasterOwnerBehavior extends Base {

    constructor (config) {
        super({
            masterAttr: 'master',
            ownerAttr: 'owner',
            ...config
        });
        this.setHandler(ActiveRecord.EVENT_BEFORE_UPDATE, this.beforeUpdate);
        this.setHandler(ActiveRecord.EVENT_BEFORE_INSERT, this.beforeUpdate);
    }

    beforeUpdate () {
        if (this.owner.get(this.masterAttr)) {
            this.owner.unset(this.ownerAttr);
        }
    }
};

const ActiveRecord = require('areto/db/ActiveRecord');