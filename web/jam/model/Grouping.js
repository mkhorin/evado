/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
Jam.ModelGrouping = class ModelGrouping {

    constructor (model) {
        this.model = model;
        this.$groups = this.model.$form.find('.form-base-group');
        this.maxDepth = 0;
        this.init();
    }

    init () {
        this.createGroups();
        this.loadStates();
        this.initHandlers();
    }

    getTabGroups () {
        return this.filterGroups(Jam.ModelTabGroup);
    }

    filterGroups (Class) {
        return this.groups.filter(group => group instanceof Class);
    }

    createGroups () {
        this.groups = [];
        this.groupMap = {};
        this.$groups.each((index, element) => {
            const $element = $(element);
            const Class = $element.hasClass('form-set')
                ? Jam.ModelGroup
                : Jam.ModelTabGroup;
            const group = new Class($element, this);
            this.groups.push(group);
            this.groupMap[group.id] = group;
        });
    }

    loadStates () {
        const data = Jam.localStorage.get(this.getStorageKey());
        if (data) {
            for (const id of Object.keys(data)) {
                if (Jam.ObjectHelper.has(id, this.groupMap)) {
                    this.groupMap[id].toggleActive(data[id]);
                }
            }
        }
        this.getTabGroups().forEach(group => group.activeDefaults());
    }

    saveStates () {
        const data = {};
        for (const group of this.groups) {
            data[group.id] = group.isActive();
        }
        Jam.localStorage.set(this.getStorageKey(), data);
    }

    getStorageKey () {
        return `model-grouping-${this.model.params.className}`;
    }

    setMaxDepth (depth) {
        this.maxDepth = this.maxDepth < depth ? depth : this.maxDepth;
    }

    /**
     * Toggle empty groups after show action
     */
    toggleEmpty () {
        for (let depth = this.maxDepth; depth >= 0; --depth) {
            for (const group of this.groups) {
                if (group.depth === depth) {
                    group.toggleEmpty();
                }
            }
        }
    }

    initHandlers () {
        this.model.$form.on('click', '.form-set-toggle', this.onSetGroup.bind(this));
        this.model.$form.on('click', '.tabs > .nav .nav-link', this.onTabGroup.bind(this));
    }

    onSetGroup (event) {
        const $group = $(event.currentTarget).closest('.form-set').toggleClass('active');
        $group.data('group').update();
    }

    onTabGroup (event) {
        event.preventDefault();
        const $nav = $(event.currentTarget);
        const $content = $nav.closest('.tabs').children('.tab-content');
        $nav.parent().children('.active').removeClass('active');
        $content.children('.active').removeClass('active');
        $nav.addClass('active');
        const $group = $content.children(`[data-id="${$nav.data('id')}"]`).addClass('active');
        // Jam.Model.get($nav.closest('.form')).onAttrParentActive($content);
        $group.data('group').update();
    }
};

Jam.ModelGroup = class ModelGroup {

    constructor ($group, grouping) {
        this.grouping = grouping;
        this.id = $group.data('id');
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

    toggleActive (state) {
        this.$group.toggleClass('active', state);
    }

    update () {
        this.grouping.saveStates();
        Jam.ModelAttr.getAttrs(this.$group).forEach(attr => attr.activate());
    }

    /**
     * A group can be hidden by binder or by empty content
     */
    toggleEmpty () {
        this.$group.toggleClass('empty-group', this.isEmpty());
    }

    isEmpty () {
        const $children = this.$content.children();
        return $children.filter('.hidden, .empty-group').length === $children.length;
    }
};

Jam.ModelTabGroup = class ModelTabGroup extends Jam.ModelGroup {

    init () {
        super.init();
        this.$tabs = this.$group.closest('.tabs');
        this.$navs = this.$tabs.children('.nav').children();
        this.$groups = this.$tabs.children('.tab-content').children();
    }

    isEmptyTabs () {
        return this.$navs.filter('.hidden, .empty-group').length === this.$navs.length;
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
        this.$group.toggleClass('hidden', !visible);
        this.getNav().toggleClass('hidden', !visible);
    }

    toggleActive (state) {
        this.getNav().toggleClass('active', state);
        this.$group.toggleClass('active', state);
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