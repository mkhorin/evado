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
            Jam.createElements(this.getPane(id).addClass('active'));
            this.events.trigger('change', {id});
        }
    }

    unsetActive () {
        this.getActiveNav().removeClass('active');
        this.getActivePane().removeClass('active');
    }

    onTab (event) {
        event.preventDefault();
        this.setActive(this.getNavByElement(event.currentTarget).data('id'));
    }

    onTabClose (event) {
        event.preventDefault();
        const id = this.getNavByElement(event.currentTarget).data('id');
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
        const text = data.text || id;
        const hint = data.hint || text;
        const close = data.close ? 'closing' : '';
        const content = data.content;
        this.getNavItems().parent()[method](`<li class="nav-tab ${close}" data-id="${id}"><a href="#" title="${hint}">${text}</a><div class="tab-close">&times;</div></li>`);
        this.getPanes().parent()[method](`<div class="tab-pane" data-id="${id}">${content}</div>`);
        this.events.trigger('create', {id});
    }
    
    deleteTab (id) {
        this.getNav(id).remove();
        this.getPane(id).remove();
        this.events.trigger('delete', {id});
    }
};