/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
Jam.FileModelAttr = class FileModelAttr extends Jam.ModelAttr {

    constructor () {
        super(...arguments);
        this.events = new Jam.Events(this.constructor.name);
    }

    init () {
        this.$uploader = this.find('.uploader');
        this.fileMessageSelector = '.uploader-message';
        this.uploader = Jam.Uploader.create(this.$uploader);
        this.uploader.on('select', this.onSelectFile.bind(this));
        this.uploader.on('overflow', this.onOverflowFile.bind(this));
        this.uploader.on('file:append', this.onAppendFile.bind(this));
        this.uploader.on('file:validate', this.onValidateFile.bind(this));
        this.uploader.on('file:start', this.onStartFile.bind(this));
        this.uploader.on('file:progress', this.onProgressFile.bind(this));
        this.uploader.on('file:upload', this.onUploadFile.bind(this));
        this.uploader.on('file:error', this.onErrorFile.bind(this));
        this.uploader.on('file:confirmDeletion', this.onConfirmFileDeletion.bind(this));
        this.uploader.on('file:delete', this.onDeleteFile.bind(this));
        this.uploader.on('file:save', this.onSaveFile.bind(this));
        this.model.frame.one('afterClose', this.afterFrameClose.bind(this));
        this.initValue();
    }

    initValue () {
        const values = Jam.Helper.parseJson(this.$value.val());
        if (Array.isArray(values)) {
            for (const value of values) {
                this.uploader.setSavedFile(value);
            }
            this.$value.val(values.map(value => value.id).join());
        }
    }

    getNameAttr () {
        return this.model.getAttr(this.getData('nameAttr'));
    }

    inProgress () {
        return this.uploader.isProcessing() ? 'Abort upload?' : false;
    }

    afterFrameClose () {
        this.uploader.abort();
    }

    onSelectFile () {
        this.$uploader.find('.uploader-overflow').hide();
    }

    onOverflowFile (event, message) {
        this.$uploader.find('.uploader-overflow').text(message).show();
    }

    onAppendFile (event, item) {
        item.$item.find('.uploader-filename').text(`${item.file.name} (${Jam.FormatHelper.asBytes(item.file.size)})`);
        this.setNameAttr(item.file.name);
        this.events.trigger('append', item);
    }

    setNameAttr (value) {
        const attr = this.getNameAttr();
        if (attr) {
            attr.setValue(value);
            attr.triggerChange();
        }
    }

    onValidateFile (event, item) {
        if (item.image) {
            item.$item.addClass('with-thumbnail');
            item.$item.find('.uploader-thumbnail').css('background-image', `url(${item.image.src})`);
        }
    }

    onStartFile (event, item) {
        item.$item.removeClass('pending').addClass('processing');
        item.$item.find(this.fileMessageSelector).text('Uploading...');
    }

    onProgressFile (event, item) {
        item.$item.find('.progress-bar').css('width', `${item.percent}%`);
    }

    onUploadFile (event, item) {
        const data = Jam.Helper.parseJson(item.info) || {};
        item.$item.removeClass('pending processing').addClass('done');
        const message = Jam.t(data.message || 'Upload completed');
        item.$item.find(this.fileMessageSelector).html(message);
        item.id = data.id;
        const value = this.uploader.options.maxFiles > 1
            ? Jam.Helper.addCommaValue(item.id, this.$value.val())
            : item.id;
        this.$value.val(value).change();
    }

    onErrorFile (event, item) {
        const message = Jam.Helper.parseJson(item.error);
        item.$item.removeClass('pending processing').addClass('failed');
        item.$item.find(this.fileMessageSelector).text(message?.file || Jam.t(item.error));
    }

    onConfirmFileDeletion (event, item) {
        const message = this.$uploader.data('deletionConfirm');
        const deferred = message ? Jam.dialog.confirmDeletion(message) : null;
        $.when(deferred).then(() => item.delete());
    }

    onDeleteFile (event, {id}) {
        if (id) {
            const value = Jam.Helper.removeCommaValue(id, this.$value.val());
            this.$value.val(value).change();
            if (this.uploader.options.delete) {
                $.post(this.uploader.options.delete, {id});
            }
        }
    }

    onSaveFile (event, item) {
        item.$item.removeClass('pending').addClass('saved');
        let name = item.file.name;
        let download = this.uploader.options.download;
        if (download) {
            name = `<a href="${download}${item.file.id}" target="_blank">${item.file.name}</a>`;
        }
        item.$item.find('.uploader-filename').html(`${name} (${item.file.size})`);
        item.$item.find(this.fileMessageSelector).html(item.file.message);
        const thumbnail = this.uploader.options.thumbnail;
        if (item.file.isImage && thumbnail) {
            item.$item.addClass('with-thumbnail');
            item.$item.find('.uploader-thumbnail').css('background-image', `url(${thumbnail}${item.file.id})`);
        }
    }
};