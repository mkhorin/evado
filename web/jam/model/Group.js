/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
Jam.ModelGroup = class ModelGroup {

    constructor ($group, grouping) {
        this.grouping = grouping;
        this.id = $group.data('id');
        this.loadable = $group.data('loadable');
        this.loaded = $group.data('loaded');
        this.$group = $group;
        this.$group.data('group', this);
        this.$content = $group.children('.model-group-body');
        this.depth = this.$group.parents('.model-group').length;
        this.init();
    }

    init () {
        this.grouping.setMaxDepth(this.depth);
    }

    isActive () {
        return this.$group.hasClass('active');
    }

    toggle (visible) {
        this.$group.toggleClass('hidden', !visible);
    }

    toggleActive (state) {
        this.$group.toggleClass('active', state);
        if (!this.isActive()) {
            return;
        }
        if (this.loadable && !this.loaded && !this.loading) {
            this.load();
        }
        this.activateAttrs();
    }

    /**
     * A group can be hidden by action binder or with empty content
     */
    toggleEmpty () {
        this.$group.toggleClass('empty-group', this.isEmpty());
    }

    isEmpty () {
        const $children = this.$content.children();
        const $hidden = $children.filter('.hidden, .empty-group');
        return $hidden.length === $children.length;
    }

    load () {
        this.loading = true;
        const model = this.grouping.model;
        const id = model.id;
        const group = this.id;
        const url = Jam.UrlHelper.addParams(model.frame.url, {id, group});
        return $.get(url).done(this.onLoad.bind(this));
    }

    onLoad (data) {
        return Jam.insertContent(data, this.$content).then(() => {
            this.grouping.model.appendAttrs(this.$content);
            this.activateAttrs();
        });
    }

    activateAttrs () {
        Jam.ModelAttr.getAttrs(this.$content).forEach(attr => attr.activate());
    }
};