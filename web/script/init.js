/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

Jam.dialog = new Jam.Dialog;
Jam.i18n = new Jam.I18n;
Jam.resource = new Jam.Resource;
Jam.deferred = new Jam.Deferred;
Jam.serverPolling = new Jam.ServerPolling;
Jam.localStorage = new Jam.LocalStorage;

Jam.i18n.translateDocument();
Jam.createElements();
Jam.Helper.executeSerialImageLoading();
Jam.Helper.fixMultipleBootstrapModals();
Jam.Helper.fixSelect2Focus();
Jam.Helper.handlePreloadLinks();
Jam.FrameStack.attachFrameLinks();
Jam.frameStack?.openFromUrl(location.search);

document.body.classList.add('main-transition');