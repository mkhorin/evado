/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
Jam.ModelTab = class ModelTab extends Jam.ModelGroup {

    init () {
        super.init();
        this.$tabs = this.$group.closest('.tabs');
        this.$navs = this.$tabs.children('.nav').children();
        this.$groups = this.$tabs.children('.tab-content').children();
    }

    isEmptyTabs () {
        const $empty = this.$navs.filter('.hidden, .empty-group');
        return $empty.length === this.$navs.length;
    }

    getNav () {
        return this.$navs.filter(`[data-id="${this.$group.data('id')}"]`);
    }

    getGroups () {
        const result = [];
        for (const element of this.$groups) {
            result.push($(element).data('group'));
        }
        return result;
    }

    toggle (visible) {
        super.toggle(visible);
        this.getNav().toggleClass('hidden', !visible);
    }

    toggleActive (state) {
        super.toggleActive(state);
        this.getNav().toggleClass('active', state);
    }

    toggleEmpty () {
        const isEmpty = this.isEmpty();
        this.getNav().toggleClass('empty-group', isEmpty);
        this.$group.toggleClass('empty-group', isEmpty);
        this.$tabs.toggleClass('empty-group', this.isEmptyTabs());
    }

    activeDefaults () {
        const groups = this.getGroups();
        const actives = groups.filter(group => group.isActive());
        if (actives.length > 1) {
            actives.slice(1).forEach(group => group.toggleActive(false));
        } else if (!actives.length) {
            groups[0].toggleActive(true);
        }
    }
};