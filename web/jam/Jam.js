/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

class Jam {

    static createElements ($container) {
        let $elements = $($container.find('[data-jam-class]').get().reverse());
        for (let element of $elements) {
            let name = element.dataset.jamClass;
            if (name) {
                let Class = this.getClass(name);
                Class && Class.prototype instanceof Jam.Element
                    ? this[name].createInstance($(element))
                    : console.error(`${name} does not extend Jam.Element`);
            }
        }
    }

    static getClass (name) {
        if (typeof name !== 'string') {
            return null;
        }
        let pos = name.indexOf('.');
        if (pos === -1) {
            return this[name];
        }
        let item = this[name.substring(0, pos)];
        return item ? this.getClass.call(item, name.substring(pos + 1)) : null;
    }

    static toggleGlobalLoader (state) {
        $(document.body).toggleClass('loading', state);
    }

    static matcherSelectLabelAndValue (term, text, option) {
        term = term.toLowerCase();
        return text.toLowerCase().indexOf(term) !== -1 || option.val().toLowerCase().indexOf(term) !== -1;
    }
}

Jam.Behavior = class {

    constructor (owner, params) {
        this.owner = owner;
        this.params = Object.assign(this.getDefaultParams(), params);
    }

    getDefaultParams () {
        return {};
    }
};

Jam.Element = class {

    static createInstance ($element) {
        return this.getInstance($element) || Reflect.construct(this, arguments);
    }

    static getInstance ($element) {
        return $element.data(`instanceOf${this.name}`);
    }

    constructor ($element) {
        this.$element = $element;
        this.setInstance($element);
    }

    setInstance ($element) {
        return $element.data(`instanceOf${this.constructor.name}`, this);
    }
};

Jam.Event = class {

    constructor (prefix, params) {
        this.prefix = prefix;
        this.$target = $('<div/>');
        this.params = params || {};
    }

    on (name, handler, data) {
        this.$target.on(this.getName(name), handler, data);
    }

    one (name, handler, data) {
        this.$target.one(this.getName(name), handler, data);
    }

    off (name, handler, data) {
        this.$target.off(this.getName(name), handler, data);
    }

    trigger (name, data) {
        this.$target.trigger(this.getName(name), data);
    }

    getName (name) {
        return this.prefix + name;
    }
};

Jam.I18n = class {

    static translate (msg, category) {
        let map = this.getCategoryMap(category);
        return map && map.hasOwnProperty(msg) ? map[msg] : msg;
    }

    static translateContainer (container, category) {
        let map = this.getCategoryMap(category);
        let $container = $(container);
        for (let element of $container.find('.l10n')) {
            this.translateElement(element, map)
        }
        let attrs = ['title', 'placeholder'];
        for (let attr of attrs) {
            for (let element of $container.find(`[${attr}]`)) {
                this.translateAttribute(attr, element, map);
            }
        }
    }

    static translateElement (element, map) {
        if (map && map.hasOwnProperty(element.innerHTML)) {
          element.innerHTML = map[element.innerHTML];
        }
    }

    static translateAttribute (name, element, map) {
        let value = element.getAttribute(name);
        if (map && map.hasOwnProperty(value)) {
            element.setAttribute(name, map[value]);
        }
    }

    static getCategoryMap (category) {
        return this.hasOwnProperty(category) ? this[category] : this.default;
    }
};

Jam.Notice = class {

    constructor (params) {
        this.params = {
            cssClasses: 'default-notice light',
            scrollSpeed: 'fast',
            template: '#notice-template',
            ...params
        };
        this.init();
    }

    init () {
        this.$notice = $($(this.params.template).html());
        let container = this.params.container;
        if (typeof container === 'function') {
            container(this.$notice);
        } else if (container) {
            container.prepend(this.$notice);
        }
        this.$notice.find('.close').click(this.hide.bind(this));
    }

    success (message) {
        this.show('success', message);
    }

    info (message) {
        this.show('info', message);
    }

    warning (message) {
        this.show('warning', message);
    }

    danger (message) {
        this.show('danger', message);
    }

    show (type, message) {
        if (typeof message === 'string') {
            this.build(type, Jam.I18n.translate(message));
            this.$notice.removeClass('hidden');
            this.scrollTo();
        }
        return this;
    }

    build (type, message) {
        this.$notice.removeClass().addClass(`${this.params.cssClasses} notice notice-${type}`);
        this.$notice.find('.message').html(message);
    }

    scrollTo () {
        if (this.params.$scrollTo) {
            this.params.$scrollTo.animate({scrollTop: 0}, this.params.scrollSpeed);
        }
    }

    hide () {
        this.$notice.addClass('hidden');
        return this;
    }
};

Jam.ContentNotice = class extends Jam.Notice {

    static clear (container) {
        (container || $('#content')).find('.content-notice').remove();
    }

    constructor (params) {
        super({
            cssClasses: 'content-notice light',
            container: $('#content'),
            ...params
        });
    }
};

Jam.Confirmation = class {

    constructor (params) {
        this.params = {
            container: '#global-confirmation',
            headText: 'Confirmation',
            confirmText: 'Confirm',
            cssClass: 'default',
            sendCancel: false,
            ...params
        };
        this.$container = $(this.params.container);
        this.$confirm = this.$container.find('.btn-confirm');
        this.$cancel = this.$container.find('.btn-cancel');
        this.$confirm.click(this.onAction.bind(this, true));
        this.$cancel.click(this.onAction.bind(this, false));
        this.$container.click(this.onContainer.bind(this));
        $(document.body).keyup(this.onKeyUp.bind(this));
    }

    showRemove (message, data) {
        return this.show(message || 'Delete this object permanently?', {
            confirmText: 'Delete',
            cssClass: 'danger',
            ...data
        });
    }

    show (message, data) {
        data = {...this.params, ...data};
        data.message = message;
        this.build(data);
        this.$container.show();
        this.$confirm.blur();
        this._sendCancel = data.sendCancel;
        this._result = $.Deferred();
        return this._result;
    }

    build (data) {
        this.$container.removeClass().addClass(`confirmation-${data.cssClass} confirmation`);
        this.$container.find('.box-head').html(Jam.I18n.translate(data.headText));
        this.$container.find('.box-body').html(Jam.I18n.translate(data.message));
        this.$confirm.html(Jam.I18n.translate(data.confirmText));
    }

    onAction (status) {
        this.$container.hide();
        if (status || this._sendCancel) {
            this._result.resolve(status);
        }
    }

    onContainer (event) {
        if (event.target === event.currentTarget) {
            this.onAction(false);
        }
    }

    onKeyUp (event) {
        if (event.keyCode === 27) {
            this.onAction(false);
        }
    }
};

Jam.Scheduler = class {

    constructor () {
        this._tasks = [];
        this._proccessing = false;
    }

    add (task) {
        this._tasks = this._tasks.concat(task);
        this.process();
    }

    process () {
        if (this._tasks.length) {
            this._tasks[0].process(this.done.bind(this));
        }
    }

    done () {
        this._tasks.shift();
        this.process();
    }
};

Jam.Task = class {

    constructor (handler, params) {
        this.handler = handler;
        this.params = params;
        this.processing = false;
    }

    process (cb) {
        if (!this.processing) {
            this.processing = true;
            this.handler(cb, this.params);
        }
    }
};

Jam.Resource = class {

    constructor () {
        this._map = {};
        for (let link of $(document.head).find('link')) {
            this.add(link.getAttribute('href'));
        }
        for (let script of $(document.head).find('link')) {
            this.add(script.getAttribute('src'));
        }
    }

    has (key) {
        return this._map[key] === true;
    }

    add (key) {
        if (this.has(key)) {
            return false;
        }
        return this._map[key] = true;
    }

    resolve (data) {
        if (typeof data !== 'string') {
            return '';
        }
        data = data.replace(this.getCssPattern(), this.replace.bind(this));
        data = data.replace(this.getJsPattern(), this.replace.bind(this));
        return data;
    }

    getJsPattern () {
        return new RegExp(`<script src="(.+)"></script>`, 'g');
    }

    getCssPattern () {
        return new RegExp(`<link href="(.+)"(.*)>`, 'g');
    }

    replace (match, key) {
        if (this.add(key)) {
            $(document.head).append(match);
        }
        return '';
    }
};

Jam.Cache = class {

    constructor () {
        this.clear();
    }

    has (key) {
        return Object.prototype.hasOwnProperty.call(this._data, key);
    }

    get (key, defaults) {
        return this.has(key) ? this._data[key] : defaults;
    }

    set (key, value) {
        this._data[key] = value;
    }

    unset (key) {
        delete this._data[key];
    }

    clear () {
        this._data = {};
    }
};

Jam.LoadableContent = class extends Jam.Element {

    constructor ($container) {
        super($container);
        this.$container = $container;
        this.$toggle = $container.find('[data-loadable-toggle]');
        this.$toggle.click(this.onToggle.bind(this));
    }

    isLoading () {
        return this.$container.hasClass('loading');
    }

    onToggle (event) {
        if (!this.isLoading()) {
            this.load();
        }
    }

    onAlways () {
        this.$container.addClass('loaded');
    }

    onDone (data) {
        this.setContent(data);
    }

    onFail () {
        this.setContent('');
    }

    load () {
        this.abort();
        this.$container.removeClass('loaded').addClass('loading');
        this.xhr = $[this.getMethod()](this.getUrl(), this.getRequestData())
            .always(this.onAlways.bind(this))
            .done(this.onDone.bind(this))
            .fail(this.onFail.bind(this));
    }

    abort () {
        if (this.xhr) {
            this.xhr.abort();
        }
        this.$container.removeClass('loading');
    }

    getMethod () {
        return this.$container.data('method') || 'get';
    }

    getUrl () {
        return this.$container.data('url');
    }

    getRequestData (key, defaults) {
        return {
            url: location.pathname,
            params: location.search,
            ...this.$container.data('params')
        };
    }

    setContent (data) {
        this.$container.find('.loadable-content').html(data);
    }
};