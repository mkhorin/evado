/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
Jam.Tabs = class Tabs extends Jam.Element {

    constructor ($container) {
        super($container);
        this.$container = $container;
        this.events = new Jam.Events('Tabs');
    }

    init () {
        this.$container.on('click', '.nav-tabs a', this.onTab.bind(this));
        this.$container.on('click', '.tab-close', this.onTabClose.bind(this));
    }

    isActive (id) {
        return this.getActiveId() === id;
    }

    getActiveId () {
        return this.getNavItems().filter('.active').data('id');
    }

    getActiveNav () {
        return this.getNavItems().filter('.active');
    }

    getNav (id) {
        return this.getNavItems().filter(`[data-id=${id}]`);
    }

    getNavByElement (element) {
        return $(element).closest('.nav-tab');
    }

    getNavItems () {
        return this.$container.children('.nav').children();
    }

    getActivePane () {
        return this.getPanes().filter('.active');
    }

    getPane (id) {
        return this.getPanes().filter(`[data-id=${id}]`);
    }

    getPanes () {
        return this.$container.children('.tab-content').children();
    }

    setActiveFirst () {
        this.setActive(this.getNavItems().first().data('id'));
    }

    setActive (id) {
        if (this.getActiveId() !== id) {
            this.unsetActive();
            this.getNav(id).addClass('active');
            const $pane = this.getPane(id).addClass('active');
            Jam.createElements($pane);
            this.events.trigger('change', {id});
        }
    }

    unsetActive () {
        this.getActiveNav().removeClass('active');
        this.getActivePane().removeClass('active');
    }

    onTab (event) {
        event.preventDefault();
        const $nav = this.getNavByElement(event.currentTarget);
        this.setActive($nav.data('id'));
    }

    onTabClose (event) {
        event.preventDefault();
        const $nav = this.getNavByElement(event.currentTarget);
        const id = $nav.data('id');
        const data = {id, close: true};
        this.events.trigger('close', data);
        if (data.close) {
            this.deleteTab(id);
            this.setActiveFirst();
        }
    }

    appendTab () {
        this.createTab('append', ...arguments);
    }

    prependTab (id) {
        this.createTab('prepend', ...arguments);
    }

    createTab (method, id, data = {}) {
        if (this.getNav(id).length) {
            return true;
        }
        const head = this.createTabHead(id, data);
        this.getNavItems().parent()[method](head);
        const pane = this.createTabPane(id, data);
        this.getPanes().parent()[method](pane);
        this.events.trigger('create', {id});
    }

    createTabHead (id, data) {
        const text = data.text || id;
        const hint = data.hint || text;
        const close = data.close ? 'closing' : '';
        return `<li class="nav-tab ${close}" data-id="${id}">`
            + `<a href="javascript:void 0" title="${hint}">${text}</a>`
            + `<div class="tab-close">&times;</div></li>`;
    }

    createTabPane (id, {content}) {
        return `<div class="tab-pane" data-id="${id}">${content}</div>`;
    }

    deleteTab (id) {
        this.getNav(id).remove();
        this.getPane(id).remove();
        this.events.trigger('delete', {id});
    }
};