/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
Jam.ActionBinderEnable = class ActionBinderEnabled extends Jam.ActionBinderAction {

    update () {
        const valid = this.isValid();
        if (this.attr) {
            this.attr.enable(valid)
        } else {
            this.$item.toggleClass('disabled', !this.isValid());
        }
    }
};