/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
Jam.ActionBinderShow = class ActionBinderShow extends Jam.ActionBinderAction {

    update () {
        const visible = this.isValid();
        const group = this.$item.data('group');
        if (group) {
            group.toggle(visible);
        } else if (this.attr) {
            this.attr.toggle(visible);
        } else {
            this.$item.toggleClass('hidden', !visible);
        }
    }
};