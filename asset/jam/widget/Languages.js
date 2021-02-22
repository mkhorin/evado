/**
 * @copyright Copyright (c) 2021 Maxim Khorin <maksimovichu@gmail.com>
 */
Jam.Languages = class Languages extends Jam.Loadable {

    init () {
        super.init();
        this.findContent().on('click', 'a', this.onLanguage.bind(this));
    }

    onLanguage (event) {
        event.preventDefault();
        const code = event.currentTarget.dataset.code;
        Jam.Helper.setCookie(this.findData('cookie'), code, {
            'max-age': this.findData('max-age')
        });
        location.reload();
    }
};