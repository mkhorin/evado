'use strict';

Ant.scheduler = new Ant.Scheduler;
Ant.resource = new Ant.Resource;
Ant.modal = new Ant.Modal($('#ant-modal'));

Ant.MainList.init();

// AUTO OPEN

(function () {
    let url = Ant.UrlHelper.getUrlParams(location.search).modal;
    if (url) {
        Ant.modal.create().load(decodeURIComponent(url));
    }
})();