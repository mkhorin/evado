/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
Jam.ActionBinderRequire = class ActionBinderRequire extends Jam.ActionBinderAction {

    update () {
        const valid = this.isValid();
        if (this.attr) {
            this.attr.require(valid)
        } else {
            this.$item.toggleClass('required', valid);
        }
    }
};