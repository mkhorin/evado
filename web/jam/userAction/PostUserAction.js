/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
Jam.PostUserAction = class PostUserAction extends Jam.UserAction {

    execute () {
        Jam.MainAlert.clear();
        return Jam.UserAction.post(this.$element)
            .done(this.onDone.bind(this))
            .fail(data => data && this.onFail(data.responseText));
    }
};