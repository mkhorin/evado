/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
Jam.ListFilter = class ListFilter {

    constructor (list, params) {
        this.list = list;
        this.conditions = [];
        this.params = {...params};
        this.$container = list.find('.list-filter');
        if (this.isExists()) {
            this.init();
        }
    }

    init () {
        this.params = Object.assign(this.params, this.$container.data('params'));
        this.events = new Jam.Events('ListFilter');
    }

    isExists () {
        return this.$container.length > 0;
    }

    isVisible () {
        return this.$container.is(':visible');
    }

    toggle (state) {
        this.$container.toggle(state);
        this.load();
        if (this.isVisible() && this.group?.isEmpty()) {
            this.onAddCondition();
        }
    }

    load () {
        if (!this._xhr) {
            this._xhr = $.get(this.params.url).done(this.build.bind(this));
        }
    }

    build (content) {
        const $content = $(content).filter('.list-filter');
        Jam.t($content);
        this.params = Object.assign(this.params, $content.data('params'));
        this.$container.html($content.html());
        this.$groupSample = this.$container.children('.filter-group');
        this.$conditionSample = this.$container.children('.filter-condition');
        this.$typeSamples = this.$container.children('.filter-types');
        this.$content = this.$container.children('.filter-content');
        this.addNestedTypeColumn();
        this.group = new Jam.ListFilterGroup(this, this.params.columns);
        this.$content.append(this.group.$container);
        this.$commands = this.$container.children('.filter-commands');
        this.$commands.find('[data-id="add"]').click(this.onAddCondition.bind(this));
        this.$apply = this.$commands.find('[data-id="apply"]').click(this.onApply.bind(this));
        this.$commands.find('[data-id="reset"]').click(this.onReset.bind(this));
        this.onAddCondition();
        this.storage = new Jam.ListFilterStorage(this);
        this.events.trigger('afterBuild');
    }

    addNestedTypeColumn () {
        this.params.columns.push(this.getNestedTypeColumn());
    }

    getNestedTypeColumn () {
        return {
            type: 'nested',
            label: 'Nested condition',
            name: '$nested',
            columns: [...this.params.columns]
        };
    }

    getAttrNames () {
        return this.params.columns.map(({name}) => name);
    }

    getAttrParams (name) {
        return this.group?.getAttrParams(name);
    }

    getTypeParams (id) {
        return this.params.types?.[id];
    }

    getEmptyCondition () {
        return this.group.getEmptyCondition();
    }

    onApply () {
        this._applied = true;
        this.list.reload({resetPage: true});
        this.triggerActive();
    }

    onReset () {
        this.group.clear();
        this.$container.hide();
        this.triggerActive();
        if (this._applied) {
            this.list.reload({resetPage: true});
            this._applied = false;
        }
    }

    onAddCondition () {
        return this.group.addCondition();
    }

    triggerActive () {
        const hasData = !!this.serialize();
        this.$container.toggleClass('active', hasData);
        this.events.trigger('toggleActive', hasData);
    }

    serialize () {
        return this.group?.serialize();
    }

    parse (items) {
        this.group.clear();
        for (const item of items) {
            this.group.addCondition().parse(item);
        }
        this.onApply();
        this.$apply.focus();
    }
};