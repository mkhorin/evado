/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

Jam.confirmation = new Jam.Confirmation;
Jam.i18n = new Jam.I18n;
Jam.resource = new Jam.Resource;
Jam.scheduler = new Jam.Scheduler;

Jam.i18n.translateContainer(document.body);
Jam.createElements(document.body);

if (Jam.modal) {
    Jam.modal.openFromUrl(location.search);
}