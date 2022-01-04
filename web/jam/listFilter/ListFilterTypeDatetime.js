/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
Jam.ListFilterTypeDatetime = class ListFilterTypeDatetime extends Jam.ListFilterTypeDate {

    getFormat () {
        return this.params.format || 'datetime';
    }
};