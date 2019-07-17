/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

Jam.scheduler = new Jam.Scheduler;
Jam.resource = new Jam.Resource;
Jam.confirmation = new Jam.Confirmation;
Jam.createElements($(document.body));
Jam.modal.openFromUrl(location.search);