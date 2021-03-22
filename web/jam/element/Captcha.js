/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
Jam.Captcha = class Captcha extends Jam.Element {

    init () {
        this.find('.captcha-refresh').click(this.onRefresh.bind(this));
    }

    onRefresh (event) {
        event.preventDefault();
        const $img = this.find('.captcha-image');
        $img.attr('src', $img.attr('src').replace(/\?_=([0-9]+)/, ()=> '?_='+ Date.now()));
    }
};