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
        super(container, $.extend(true, {
            'Renderer': Jam.TreeGridRenderer,
            'AjaxProvider': Jam.TreeGridAjaxProvider
        }, Jam.TreeGrid.defaults, params));
    }

    init () {
        super.init();
        this.renderer.addBodyListener('click', '.node-toggle', this.onToggleNode.bind(this));
    }

    getNode (id) {
        return this.getNodeByItem(this.findItemById(id));
    }

    getNodeByItem ($item) {
        return Jam.TreeGridNode.get({grid: this, $item});
    }

    onToggleNode (event) {
        this.getNodeByItem($(event.currentTarget).closest('.data-item')).toggle();
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