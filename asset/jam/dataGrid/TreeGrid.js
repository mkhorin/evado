/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
Jam.TreeGrid = class TreeGrid extends Jam.DataGrid {

    constructor (container, params) {
        super(container, $.extend(true, {
            'Renderer': Jam.TreeGridRenderer,
            'AjaxProvider': Jam.TreeGridAjaxProvider
        }, Jam.TreeGrid.defaults, params));
    }

    init () {
        super.init();
        this.renderer.$tbody.on('click', '.node-toggle', this.onToggleNode.bind(this));
    }

    getNode (id) {
        return this.getNodeByRow(this.findRowById(id));
    }

    getNodeByRow ($row) {
        return Jam.TreeGridNode.get({grid: this, $row});
    }

    onToggleNode (event) {
        this.getNodeByRow($(event.currentTarget).closest('tr')).toggle();
    }

    load (params = {}) {
        this.itemNode = params.node;
        super.load(params);
    }

    drawPage () {
        this.itemNode ? this.drawNode(this.itemNode) : super.drawPage();
    }

    drawNode (node) {
        node.getNestedRows().remove();
        this.renderer.drawNode(node.$row, this.items);
        this.events.trigger('afterDrawNode', node);
    }
};

Jam.TreeGrid.defaults = {
    clearCollapsedNode: true,
    nodeToggle: '<div class="node-toggle"><i class="fas fa-angle-right"></i></div>'
};