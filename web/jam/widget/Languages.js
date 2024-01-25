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
        const {code} = event.currentTarget.dataset;
        const name = this.findData('cookie');
        const age = this.findData('max-age');
        Jam.CookieHelper.set(name, code, {
            'max-age': age
        });
        location.reload();
    }
};