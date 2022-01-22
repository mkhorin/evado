/**
 * @copyright Copyright (c) 2021 Maxim Khorin <maksimovichu@gmail.com>
 */
Jam.MainAlert = class MainAlert extends Jam.Alert {

    static clear () {
        $('.main-alert').remove();
    }

    constructor (params) {
        super({
            css: 'main-alert',
            container: $('.main-container'),
            ...params
        });
    }
};