/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
Jam.TreeGrid = class TreeGrid extends Jam.DataGrid {

    static defaults = {
        ...Jam.DataGrid.defaults,
        clearCollapsedNode: true,
        nodeToggle: '<div class="node-toggle"><i class="fas fa-angle-right"></i></div>'
    };

    constructor (container, params) {
        const defaultParams = {
            Renderer: Jam.TreeGridRenderer,
            AjaxProvider: Jam.TreeGridAjaxProvider
        };
        params = $.extend(true, defaultParams, Jam.TreeGrid.defaults, params);
        super(container, params);
    }

    init () {
        super.init();
        this.renderer.addBodyListener('click', '.node-toggle', this.onToggleNode.bind(this));
    }

    getNode (id) {
        const item = this.findItemById(id);
        return this.getNodeByItem(item);
    }

    getNodeByItem ($item) {
        return Jam.TreeGridNode.get({
            grid: this,
            $item
        });
    }

    onToggleNode ({currentTarget}) {
        const item = $(currentTarget).closest('.data-item');
        this.getNodeByItem(item).toggle();
    }

    load (params = {}) {
        this.itemNode = params.node;
        super.load(params);
    }

    drawPage () {
        this.itemNode
            ? this.drawNode(this.itemNode)
            : super.drawPage();
    }

    drawNode (node) {
        node.getNestedItems().remove();
        this.renderer.drawNode(node.$item, this.items);
        this.events.trigger('afterDrawNode', node);
    }
};