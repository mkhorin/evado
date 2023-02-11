/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
Jam.TreeGridNode = class TreeGridNode {

    static get ({$item}) {
        return $item.data('node') || Reflect.construct(this, arguments);
    }

    constructor (config) {
        Object.assign(this, config);
        this.$item.data('node', this);
    }

    isOpened () {
        return this.$item.hasClass('opened');
    }

    getId () {
        return this.$item.data('id');
    }

    getDepth () {
        return parseInt(this.$item.data('depth'));
    }

    getParentNode () {
        return this.getParent().data('node');
    }

    getParent () {
        const selector = this.getDepthSelector(this.getDepth() - 1);
        return this.$item.prevUntil(selector).add(this.$item).prev(selector);
    }

    getChildren () {
        const selector = this.getDepthSelector(this.getDepth() + 1);
        return this.getNestedItems().filter(selector);
    }

    getNestedItems () {
        const depth = this.getDepth();
        const selector = this.getDepthSelector(depth);
        const $items = this.$item.nextUntil(selector);
        return $items.filter((index, element) => {
            return element.dataset.depth > depth;
        });
    }

    getDepthSelector (depth) {
        return `[data-depth="${depth}"]`;
    }

    toggle (state) {
        this.$item.toggleClass('opened', state);
        this.isOpened() ? this.expand() : this.collapse();
    }

    collapse () {
        const $children = this.getChildren();
        const $items = $children.filter('.opened');
        for (const item of $items) {
            this.grid.getNodeByItem($(item)).toggle(false);
        }
        if (this.grid.params.clearCollapsedNode) {
            $children.remove();
            this.loaded = false;
        } else {
            this._detachedChildren = $children.detach();
        }
    }

    expand () {
        this.loaded
            ? this.$item.after(this._detachedChildren)
            : this.load();
    }

    load () {
        this.loaded = true;
        return this.grid.load({node: this});
    }

    reloadParent () {
        const parent = this.getParentNode();
        return parent ? parent.load() : this.grid.load();
    }
};