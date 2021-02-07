/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
Jam.TreeGridNode = class TreeGridNode {

    static get ({$row}) {
        return $row.data('node') || Reflect.construct(this, arguments);
    }

    constructor (config) {
        Object.assign(this, config);
        this.$row.data('node', this);
    }

    isOpened () {
        return this.$row.hasClass('opened');
    }

    getId () {
        return this.$row.data('id');
    }

    getDepth () {
        return parseInt(this.$row.data('depth'));
    }

    getChildren () {
        return this.getNestedRows().filter(`[data-depth="${this.getDepth() + 1}"]`);
    }

    getNestedRows () {
        const depth = this.getDepth();
        return this.$row.nextUntil(`[data-depth="${depth}"]`).filter((index, element) => {
            return element.dataset.depth > depth;
        });
    }

    toggle (state) {
        this.$row.toggleClass('opened', state);
        this.isOpened() ? this.expand() : this.collapse();
    }

    collapse () {
        const $children = this.getChildren();
        for (const row of $children.filter('.opened')) {
            this.grid.getNodeByRow($(row)).toggle(false);
        }
        if (this.grid.params.clearCollapsedNode) {
            $children.remove();
            this.loaded = false;
        } else {
            this._detachedChildren = $children.detach();
        }
    }

    expand () {
        this.loaded ? this.$row.after(this._detachedChildren) : this.load();
    }

    load () {
        this.loaded = true;
        this.grid.load({node: this});
    }
};