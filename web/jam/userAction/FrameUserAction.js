/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
Jam.FrameUserAction = class FrameUserAction extends Jam.UserAction {

    execute () {
        Jam.MainAlert.clear();
        return this.constructor.confirm(this.$element).then(this.onConfirm.bind(this));
    }

    onConfirm () {
        const frame = Jam.frameStack.createFrame();
        frame.load(this.getParam('url'), this.getParam('params'));
        frame.one('afterClose', this.onDone.bind(this));
    }

    onDone (event, data) {
        if (data?.result) {
            super.onDone(data.result);
        }
    }
};