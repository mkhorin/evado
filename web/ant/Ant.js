'use strict';

class Ant {

    static toggleGlobalLoading (state) {
        $(document.body).toggleClass('loading', state);
    }

    static postAction ($btn, params) {
        if (!Ant.Helper.confirm($btn.data('confirm'))) {
            return $.Deferred().reject();
        }
        Ant.toggleGlobalLoading(true);
        return $.post($btn.data('url'), params).always(()=> Ant.toggleGlobalLoading(false));
    }

    static matcherSelectLabelAndValue (term, text, option) {
        term = term.toLowerCase();
        return text.toLowerCase().indexOf(term) !== -1 || option.val().toLowerCase().indexOf(term) !== -1;
    }
}

Ant.Behavior = class {

    constructor (owner, params) {
        this.owner = owner;
        this.params = Object.assign(this.getDefaultParams(), params);
    }

    getDefaultParams () {
        return {};
    }
};

Ant.Event = class {

    constructor (prefix, params) {
        this.prefix = prefix;
        this.$target = $('<div></div>');
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

Ant.I18n = class {

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

Ant.Notice = class {

    constructor (params) {
        this.params = {
            cssClasses: 'default-notice light',
            scrollSpeed: 'fast',
            template: '<div style="display:none;"><button type="button" class="close">×</button><p class="message"></p></div>',
            ...params
        };
        this.$notice = $(this.params.template);
        let container = this.params.container;
        if (typeof container === 'function') {
            container(this.$notice);
        } else if (container) {
            container.prepend(this.$notice);
        }
        this.$notice.find('.close').click(this.hide.bind(this));
    }

    hide () {
        this.$notice.hide();
        return this;
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
        if (message !== undefined) {
            this.build(type, Ant.I18n.translate(message));
            this.$notice.show();
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
};

Ant.ContentNotice = class extends Ant.Notice {

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

Ant.Scheduler = class {

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

Ant.Task = class {

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

Ant.Resource = class {

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