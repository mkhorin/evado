/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
Jam.UtilityBar = class UtilityBar extends Jam.UtilityMenu {

    init () {
        for (const item of this.items) {
            const utility = this.renderItem('button', item);
            if (utility) {
                this.$container.append(utility.$item);
            }
        }
    }
};