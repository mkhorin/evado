/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
Jam.ModelGrouping = class ModelGrouping {

    static URL_PATTERNS = [];

    static getActiveLoadableGroups (url) {
        return Jam.localStorage.get(this.getStorageKey(url))?.[2];
    }

    static getStorageKey (url) {
        return `model-grouping-${Jam.UrlHelper.getKey(url, this.URL_PATTERNS)}`;
    }

    constructor (model) {
        this.model = model;
        this.$groups = this.model.$form.find('.model-group');
        this.maxDepth = 0;
        this.init();
    }

    init () {
        this.createGroups();
        this.loadStates();
        this.initHandlers();
    }

    getGroup (id) {
        return Jam.ObjectHelper.has(id, this.groupMap) ? this.groupMap[id] : null;
    }

    getTabGroups () {
        return this.filterGroups(Jam.ModelTab);
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
                : Jam.ModelTab;
            const group = new Class($element, this);
            this.groups.push(group);
            this.groupMap[group.id] = group;
        });
    }

    loadStates () {
        const data = Jam.localStorage.get(this.getStorageKey());
        this.loadState(data?.[0], true);
        this.loadState(data?.[1], false);
        this.getTabGroups().forEach(group => group.activeDefaults());
    }

    loadState (names, active) {
        if (Array.isArray(names)) {
            for (const name of names) {
                this.getGroup(name)?.toggleActive(active);
            }
        }
    }

    saveStates () {
        const active = [];
        const activeLoadable = [];
        const inactive = [];
        for (const group of this.groups) {
            (group.isActive() ? active : inactive).push(group.id);
            if (group.loadable && group.isActive() ) {
                activeLoadable.push(group.id);
            }
        }
        Jam.localStorage.set(this.getStorageKey(), [active, inactive, activeLoadable]);
    }

    getStorageKey () {
        return this.constructor.getStorageKey(this.model.frame.url);
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
        this.model.$form.on('click', '.form-set-toggle', this.onSet.bind(this));
        this.model.$form.on('click', '.tabs > .nav .nav-link', this.onTab.bind(this));
    }

    onSet (event) {
        $(event.currentTarget).closest('.form-set').data('group')?.toggleActive();
        this.saveStates();
    }

    onTab (event) {
        event.preventDefault();
        const $nav = $(event.currentTarget);
        const id = $nav.data('id');
        const $content = $nav.closest('.tabs').children('.tab-content');
        for (const element of $content.children()) {
            const tab = $(element).data('group');
            tab?.toggleActive(tab?.id === id);
        }
        this.saveStates();
    }
};

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
     * A group can be hidden by binder or by empty content
     */
    toggleEmpty () {
        this.$group.toggleClass('empty-group', this.isEmpty());
    }

    isEmpty () {
        const $children = this.$content.children();
        return $children.filter('.hidden, .empty-group').length === $children.length;
    }

    load () {
        this.loading = true;
        const model = this.grouping.model;
        const id = model.id;
        const group = this.id;
        return $.get(model.frame.url, {id, group}).done(this.onLoad.bind(this));
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

Jam.ModelTab = class ModelTab extends Jam.ModelGroup {

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