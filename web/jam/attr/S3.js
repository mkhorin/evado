/**
 * @copyright Copyright (c) 2021 Maxim Khorin <maksimovichu@gmail.com>
 */
Jam.S3ModelAttr = class S3ModelAttr extends Jam.FileModelAttr {

    init () {
        super.init();
        const {options} = this.uploader;
        this.defaultUploadUrl = options.upload;
        options.upload = this.getUploadUrl.bind(this);
        options.prepareUploadData = this.prepareUploadData.bind(this);
    }

    getUploadUrl (item) {
        const deferred = $.Deferred();
        const {name, size, type} = item.file;
        $.post(this.defaultUploadUrl, {name, size, type})
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

    onUploadFile (event, {$item, info, id}) {
        $item.removeClass('pending processing').addClass('done');
        $item.find(this.fileMessageSelector).html(Jam.t(info));
        const value = this.uploader.options.maxFiles > 1
            ? Jam.Helper.addCommaValue(id, this.$value.val())
            : id;
        this.$value.val(value).change();
    }

    prepareUploadData (data, {file}) {
        return file;
    }
};