/**
 * @copyright Copyright (c) 2021 Maxim Khorin <maksimovichu@gmail.com>
 */
Jam.SidebarToggle = class SidebarToggle extends Jam.Element {

    init () {
        this.$element.on('click', this.onToggle.bind(this));
    }

    onToggle () {
        document.body.classList.toggle('toggled-sidebar');
    }
};