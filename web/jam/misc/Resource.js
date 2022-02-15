/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
Jam.Resource = class Resource {

    resolve (content) {
        const container = document.createElement('template');
        container.innerHTML = content;
        const result = container.content;
        const elements = [];
        this.createElements('link', 'href', result, elements);
        this.createElements('script', 'src', result, elements);
        return this.loadElements(elements, result);
    }

    loadElements (elements, result) {
        return new Promise((resolve, reject) => {
            Jam.AsyncHelper.each(elements, (element, cb) => {
                element.addEventListener('load', () => cb(), {once: true});
            }, err => err ? reject(err) : resolve(result));
        });
    }

    createElements (selector, key, container, elements) {
        for (const node of container.querySelectorAll(selector)) {
            const id = node[key];
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
        element.type = node.type;
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