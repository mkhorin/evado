/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

class Jam {

    static createElements (container = document.body) {
        const instances = [];
        const elements = $(container).find('[data-jam]').get().reverse();
        for (let element of elements) {
            const name = element.dataset.jam;
            if (!name) {
                continue;
            }
            const Class = this.getClass(name);
            if (Class && Class.prototype instanceof Jam.Element) {
                instances.push(this[name].createInstance($(element)));
            } else {
                console.error(`Invalid Jam.Element: ${name}`);
            }
        }
        for (let instance of instances) {
            instance.init();
        }
    }

    static getClass (name) {
        if (typeof name !== 'string') {
            return null;
        }
        const pos = name.indexOf('.');
        if (pos === -1) {
            return this[name];
        }
        const item = this[name.substring(0, pos)];
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
        return $element.data(`jamOf${this.name}`);
    }

    constructor ($element) {
        this.$element = $element;
        this.setInstance($element);
    }

    init () {
    }

    setInstance ($element) {
        return $element.data(`jamOf${this.constructor.name}`, this);
    }
};

Jam.Events = class {

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
        this.$container.find('.box-head').html(Jam.i18n.translate(data.headText));
        this.$container.find('.box-body').html(Jam.i18n.translate(data.message));
        this.$confirm.html(Jam.i18n.translate(data.confirmText));
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

Jam.IndexSorting = class extends Jam.Element {

    init () {
        this.sort();
    }

    sort () {
        this.$element.children().sort((a, b)=> a.dataset.index - b.dataset.index).appendTo(this.$element);
    }
};

Jam.Captcha = class extends Jam.Element {

    init () {
        this.$element.find('.captcha-refresh').click(this.onRefresh.bind(this));
    }

    onRefresh (event) {
        event.preventDefault();
        let $img = this.$element.find('.captcha-image');
        $img.attr('src', $img.attr('src').replace(/\?_=([0-9]+)/, ()=> '?_='+ Date.now()));
    }
};