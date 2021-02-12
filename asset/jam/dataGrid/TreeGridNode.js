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

    getChildren () {
        return this.getNestedItems().filter(`[data-depth="${this.getDepth() + 1}"]`);
    }

    getNestedItems () {
        const depth = this.getDepth();
        return this.$item.nextUntil(`[data-depth="${depth}"]`).filter((index, element) => {
            return element.dataset.depth > depth;
        });
    }

    toggle (state) {
        this.$item.toggleClass('opened', state);
        this.isOpened() ? this.expand() : this.collapse();
    }

    collapse () {
        const $children = this.getChildren();
        for (const item of $children.filter('.opened')) {
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
        this.grid.load({node: this});
    }
};