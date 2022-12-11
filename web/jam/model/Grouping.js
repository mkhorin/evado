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
            const Class = this.getGroupClass($element);
            const group = new Class($element, this);
            this.groups.push(group);
            this.groupMap[group.id] = group;
        });
    }

    getGroupClass ($element) {
        return $element.hasClass('tab-pane') ? Jam.ModelTab : Jam.ModelGroup;
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
                const group = this.getGroup(name);
                group?.toggleActive(active);
            }
        }
    }

    saveStates () {
        const active = [];
        const activeLoadable = [];
        const inactive = [];
        for (const group of this.groups) {
            const list = group.isActive() ? active : inactive;
            list.push(group.id);
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
        if (this.maxDepth < depth) {
            this.maxDepth = depth;
        }
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

    onSet ({currentTarget}) {
        const group = $(currentTarget).closest('.form-set').data('group');
        group?.toggleActive();
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