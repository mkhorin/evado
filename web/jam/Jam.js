/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

class Jam {

    static createElements (container = document.body) {
        const instances = [];
        const elements = $(container).find('[data-jam]').get().reverse();
        for (const element of elements) {
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
        for (const instance of instances) {
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
        return text.toLowerCase().includes(term) || option.val().toLowerCase().includes(term);
    }
}

Jam.Behavior = class Behavior {

    constructor (owner, params) {
        this.owner = owner;
        this.params = Object.assign(this.getDefaultParams(), params);
    }

    getDefaultParams () {
        return {};
    }
};

Jam.Element = class Element {

    static createInstance ($element) {
        return this.getInstance($element) || Reflect.construct(this, arguments);
    }

    static getInstance ($element) {
        return $element.data(`jammed`);
    }

    static findInstanceByClass (instanceClass, $container) {
        for (const element of $container.find('[data-jam]')) {
            const instance = this.getInstance($(element));
            if (instance instanceof instanceClass) {
                return instance;
            }
        }
    }

    constructor ($element) {
        this.$element = $element;
        this.setInstance($element);
    }

    init () {
    }

    findInstanceByClass (instanceClass) {
        return this.constructor.findInstanceByClass(instanceClass, this.$element);
    }

    setInstance ($element) {
        return $element.data('jammed', this);
    }
};

Jam.Events = class Events {

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

Jam.Dialog = class Dialog {

    constructor (params) {
        this.params = {
            container: '#main-dialog',
            header: 'Dialog',
            submitText: 'OK',
            cancelText: 'Cancel',
            returnCancel: false,
            strictCancel: false,
            cssClass: 'default',
            ...params
        };
        this.$container = $(this.params.container);
        this.$submit = this.$container.find('.btn-submit');
        this.$cancel = this.$container.find('.btn-cancel');
        this.$submit.click(this.onAction.bind(this, true));
        this.$cancel.click(this.onAction.bind(this, false));
        this.$container.click(this.onContainer.bind(this));
        this.$container.keyup(this.onKeyUp.bind(this));
    }

    confirmDeletion (message, data) {
        return this.confirm(message || 'Delete permanently?', {
            submitText: 'Delete',
            cssClass: 'danger',
            ...data
        });
    }

    confirm (message, data) {
        return this.show(message, {
            header: 'Confirmation',
            cssClass: 'warning',
            ...data
        });
    }

    alert (message, data) {
        return this.show(message, {
            header: 'Warning',
            submitText: false,
            cancelText: 'Close',
            cssClass: 'warning',
            ...data
        });
    }

    show (message, data) {
        data = {...this.params, ...data};
        data.message = message;
        this.build(data);
        this.$container.show();
        if (!data.strictCancel) {
            this.$cancel.focus();
        }
        this._returnCancel = data.returnCancel;
        this._strictCancel = data.strictCancel;
        this._result = $.Deferred();
        return this._result;
    }

    build (data) {
        this.$container.removeClass().addClass(`dialog-${data.cssClass} dialog`);
        this.$container.find('.box-head').html(Jam.i18n.translate(data.header));
        this.$container.find('.box-body').html(Jam.i18n.translate(data.message));
        this.$submit.html(Jam.i18n.translate(data.submitText)).toggle(!!data.submitText);
        this.$cancel.html(Jam.i18n.translate(data.cancelText)).toggle(!!data.cancelText);
    }

    onAction (status) {
        this.$container.hide();
        if (status || this._returnCancel) {
            this._result.resolve(status);
        }
    }

    onContainer (event) {
        if (event.target === event.currentTarget && !this._strictCancel) {
            this.onAction(false);
        }
    }

    onKeyUp (event) {
        if (event.keyCode === 27 && !this._strictCancel) {
            this.onAction(false);
        }
    }
};

Jam.Deferred = class Deferred {

    constructor () {
        this._tasks = [];
        this._proccessing = false;
    }

    add (task) {
        if (!(task instanceof Jam.DeferredTask)) {
            task = new Jam.DeferredTask(...arguments);
        }
        this._tasks.push(task);
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

Jam.DeferredTask = class DeferredTask {

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

Jam.Resource = class Resource {

    resolve (content, done) {
        const container = document.createElement('template');
        container.innerHTML = content;
        const result = container.content;
        const elements = [];
        this.resolveElements('link', 'href', result, elements);
        this.resolveElements('script', 'src', result, elements);
        Jam.AsyncHelper.each(elements, (element, cb) => {
            element.addEventListener('load', event => cb(), {once: true});
        }, ()=> done(result));
    }

    resolveElements (selector, key, container, elements) {
        for (const node of container.querySelectorAll(selector)) {
            const id = node.getAttribute(key);
            const data = this.getData();
            if (data[id] !== true) {
                elements.push(this.createElement(selector, key, node));
                data[id] = true;
            }
            node.remove();
        }
    }

    createElement (selector, key, node) {
        const element = document.createElement(selector);
        element[key] = node[key];
        element.rel = node.rel;
        document.head.appendChild(element);
        return element;
    }

    getData () {
        if (!this._data) {
            this._data = this.createData();
        }
        return this._data;
    }

    createData () {
        const data = {};
        this.indexElements('link', 'href', data);
        this.indexElements('script', 'src', data);
        return data;
    }

    indexElements (selector, key, data) {
        for (const node of document.querySelectorAll(selector)) {
            data[node[key]] = true;
        }
    }
};

Jam.Cache = class Cache {

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

Jam.IndexSorting = class IndexSorting extends Jam.Element {

    init () {
        this.sort();
    }

    sort () {
        this.$element.children().sort((a, b) => a.dataset.index - b.dataset.index).appendTo(this.$element);
    }
};

Jam.Captcha = class Captcha extends Jam.Element {

    init () {
        this.$element.find('.captcha-refresh').click(this.onRefresh.bind(this));
    }

    onRefresh (event) {
        event.preventDefault();
        let $img = this.$element.find('.captcha-image');
        $img.attr('src', $img.attr('src').replace(/\?_=([0-9]+)/, ()=> '?_='+ Date.now()));
    }
};