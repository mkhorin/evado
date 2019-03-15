'use strict';

Ant.ModelGrouper = class {

    constructor (model) {
        this.model = model;
        this.$groups = this.model.$form.find('.form-base-group');
        this.maxDepth = 0;
        this.init();
    }

    init () {
        this.groups = this.createGroups();
        this.loadStates();
    }

    getActiveGroup () {
        for (let group of this.groups) {
            if (group.isActive()) {
                return group;
            }
        }
    }

    createGroups () {
        let groups = [];
        this.$groups.each((index, element)=> {
            let $element = $(element);
            let constructor = $element.hasClass('form-set') ? Ant.ModelGroup : Ant.ModelTabGroup;
            groups.push(new constructor(index, $element, this));
        });
        return groups;
    }

    loadStates () {
        let data = store.get(this.getStoreId());
        if (data instanceof Array && data.length === this.groups.length) {
            for (let i = 0; i < data.length; ++i) {
                this.groups[i].toggleState(data[i]);
            }
        }
        if (this.groups.length && !this.getActiveGroup()) {
            this.groups[0].toggleState(true);
        }
    }

    saveStates () {
        let data = [];
        for (let group of this.groups) {
            data.push(group.isActive());
        }
        store.set(this.getStoreId(), data);
    }

    getStoreId () {
        return `model-grouper-${this.model.params.className}`;
    }

    setMaxDepth (depth) {
        this.maxDepth = this.maxDepth < depth ? depth : this.maxDepth;
    }

    toggleEmpty () { // after attraction visible
        for (let depth = this.maxDepth; depth >= 0; --depth) {
            for (let group of this.groups) {
                if (group.depth === depth) {
                    group.toggleEmpty();
                }
            }
        }
    }
};

Ant.ModelGroup = class {

    constructor (id, $group, grouper) {
        this.id = grouper;
        this.grouper = grouper;
        this.$group = $group;
        this.$group.data('group', this);
        this.$content = $group.children('.form-base-group-body');
        this.depth = this.$group.parents('.form-base-group').length;
        this.init();
    }

    init () {
        this.grouper.setMaxDepth(this.depth);
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
        this.grouper.saveStates();
        Ant.ModelAttr.getAttrs(this.$group).forEach(attr => attr.activate());
    }

    // a group can be hidden by attraction or by empty content
    toggleEmpty () {
        this.$group.toggleClass('empty-group', this.isEmpty());
    }

    isEmpty () {
        let $children = this.$content.children();
        return $children.filter('.hidden, .empty-group').length === $children.length;
    }
};

Ant.ModelTabGroup = class extends Ant.ModelGroup {

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
        let isEmpty = this.isEmpty();
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