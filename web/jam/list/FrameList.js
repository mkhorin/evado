/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
Jam.FrameList = class FrameList extends Jam.List {

    init() {
        Object.assign(this.params, this.frame.initParams);
        super.init();
        this.frame.findScrollHeader().append(this.$commands);
    }
};