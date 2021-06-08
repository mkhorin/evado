/**
 * @copyright Copyright (c) 2021 Maxim Khorin <maksimovichu@gmail.com>
 */
Jam.S3ModelAttr = class S3ModelAttr extends Jam.FileModelAttr {

    init () {
        super.init();
        this.defaultUploadUrl = this.uploader.options.upload;
        this.uploader.options.upload = this.getUploadUrl.bind(this);
        this.uploader.options.prepareUploadData = this.prepareUploadData.bind(this);
    }

    getUploadUrl (item) {
        const deferred = $.Deferred();
        const data = {
            name: item.file.name,
            size: item.file.size,
            type: item.file.type
        };
        $.post(this.defaultUploadUrl, data)
            .done(this.onUploadUrl.bind(this, deferred, item))
            .fail(this.onFailUrl.bind(this, deferred));
        return deferred;
    }

    onUploadUrl (deferred, item, data) {
        item.id = data.id;
        deferred.resolve(data.url);
    }

    onFailUrl (deferred, data) {
        deferred.reject(data.responseText || data.statusText);
    }

    onUploadFile (event, item) {
        item.$item.removeClass('pending processing').addClass('done');
        item.$item.find(this.fileMessageSelector).html(Jam.t(item.info));
        const value = this.uploader.options.maxFiles > 1
            ? Jam.Helper.addCommaValue(item.id, this.$value.val())
            : item.id;
        this.$value.val(value).change();
    }

    prepareUploadData (data, item) {
        return item.file;
    }
};