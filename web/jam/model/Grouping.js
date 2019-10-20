/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

Jam.ModelGrouping = class ModelGrouping {

    constructor (model) {
        this.model = model;
        this.$groups = this.model.$form.find('.form-base-group');
        this.maxDepth = 0;
        this.init();
    }

    init () {
        this.groups = this.createGroups();
        this.loadStates();
        this.initHandlers();
    }

    getActiveGroup () {
        for (const group of this.groups) {
            if (group.isActive()) {
                return group;
            }
        }
    }

    createGroups () {
        const groups = [];
        this.$groups.each((index, element)=> {
            const $element = $(element);
            const Class = $element.hasClass('form-set') ? Jam.ModelGroup : Jam.ModelTabGroup;
            groups.push(new Class(index, $element, this));
        });
        return groups;
    }

    loadStates () {
        const data = store.get(this.getStoreKey());
        if (Array.isArray(data) && data.length === this.groups.length) {
            for (let i = 0; i < data.length; ++i) {
                this.groups[i].toggleState(data[i]);
            }
        }
        if (this.groups.length && !this.getActiveGroup()) {
            this.groups[0].toggleState(true);
        }
    }

    saveStates () {
        const data = [];
        for (const group of this.groups) {
            data.push(group.isActive());
        }
        store.set(this.getStoreKey(), data);
    }

    getStoreKey () {
        return `model-grouping-${this.model.params.className}`;
    }

    setMaxDepth (depth) {
        this.maxDepth = this.maxDepth < depth ? depth : this.maxDepth;
    }

    toggleEmpty () { // after binder visible
        for (let depth = this.maxDepth; depth >= 0; --depth) {
            for (const group of this.groups) {
                if (group.depth === depth) {
                    group.toggleEmpty();
                }
            }
        }
    }

    initHandlers () {
        this.model.$form.on('click', '.form-set-toggle', this.onClickSetGroup.bind(this));
        this.model.$form.on('click', '.form-tabs > .nav-tabs a', this.onClickTabGroup.bind(this));
    }

    onClickSetGroup (event) {
        const $group = $(event.currentTarget).closest('.form-set').toggleClass('active');
        $group.data('group').update();
        /*
        if (!$group.hasClass('collapsed')) {
            Jam.Model.get($group.data('grouping').closest('.form')).onAttrParentActive($group);
            // Jam.Model.get($group.closest('.form')).onAttrParentActive($group);
        }//*/
    }

    onClickTabGroup (event) {
        event.preventDefault();
        const $nav = $(event.currentTarget).parent();
        const $content = $nav.closest('.tabs').children('.tab-content');
        $nav.parent().children('.active').removeClass('active');
        $content.children('.active').removeClass('active');
        $nav.addClass('active');
        const $group = $content.children(`[data-id="${$nav.data('id')}"]`).addClass('active');
        // Jam.Model.get($nav.closest('.form')).onAttrParentActive($content);
        $group.data('group').update();
    }
};

Jam.ModelGroup = class {

    constructor (id, $group, grouping) {
        this.id = grouping;
        this.grouping = grouping;
        this.$group = $group;
        this.$group.data('group', this);
        this.$content = $group.children('.form-base-group-body');
        this.depth = this.$group.parents('.form-base-group').length;
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

    toggleState (state) {
        this.$group.toggleClass('active', state);
    }

    update () {
        this.grouping.saveStates();
        Jam.ModelAttr.getAttrs(this.$group).forEach(attr => attr.activate());
    }

    // a group can be hidden by binder or by empty content
    toggleEmpty () {
        this.$group.toggleClass('empty-group', this.isEmpty());
    }

    isEmpty () {
        const $children = this.$content.children();
        return $children.filter('.hidden, .empty-group').length === $children.length;
    }
};

Jam.ModelTabGroup = class extends Jam.ModelGroup {

    init () {
        super.init();
        this.$tabs = this.$group.closest('.tabs');
        this.$navs = this.$tabs.children('.nav').children();
    }

    toggle (visible) {
        this.$group.toggleClass('hidden', !visible);
        this.getNav().toggleClass('hidden', !visible);
    }

    toggleState (state) {
        this.getNav().toggleClass('active', state);
        this.$group.toggleClass('active', state);
    }

    toggleEmpty () {
        const isEmpty = this.isEmpty();
        this.getNav().toggleClass('empty-group', isEmpty);
        this.$group.toggleClass('empty-group', isEmpty);
        this.$tabs.toggleClass('empty-group', this.isEmptyTabs());
    }

    getNav () {
        return this.$navs.filter(`[data-id="${this.$group.data('id')}"]`);
    }

    isEmptyTabs () {
        return this.$navs.filter('.hidden, .empty-group').length === this.$navs.length;
    }
};