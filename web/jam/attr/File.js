/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

Jam.FileModelAttr = class FileModelAttr extends Jam.ModelAttr {

    constructor () {
        super(...arguments);
        this.events = new Jam.Events(this.constructor.name);
    }

    init () {
        this.$uploader = this.$attr.find('.uploader');
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
        this.model.modal.one('afterClose', this.afterModalClose.bind(this));
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

    inProgress () {
        return this.uploader.isProcessing() ? 'Abort upload?' : false;
    }

    afterModalClose () {
        this.uploader.abort();
    }

    onSelectFile () {
        this.$uploader.find('.uploader-overflow').hide();
    }

    onOverflowFile (event, data) {
        this.$uploader.find('.uploader-overflow').text(data).show();
    }

    onAppendFile (event, data) {
        data.$item.find('.uploader-filename').text(`${data.file.name} (${Jam.FormatHelper.asBytes(data.file.size)})`);
        this.events.trigger('append', data);
    }

    onValidateFile (event, data) {
        if (data.image) {
            data.$item.addClass('preview');
            data.$item.find('.uploader-preview').css('background-image', `url(${data.image.src})`);
        }
    }

    onStartFile (event, data) {
        data.$item.removeClass('pending').addClass('processing');
        data.$item.find(this.fileMessageSelector).text('Uploading...');
    }

    onProgressFile (event, data) {
        data.$item.find('.progress-bar').css('width', `${data.percent}%`);
    }

    onUploadFile (event, data) {
        data.info = Jam.Helper.parseJson(data.info) || {};
        data.$item.removeClass('pending processing').addClass('done');
        const message = Jam.i18n.translate(data.info.message || 'Upload completed');
        data.$item.find(this.fileMessageSelector).html(message);
        const value = this.uploader.options.maxFiles > 1
            ? Jam.Helper.addCommaValue(data.info.id, this.$value.val())
            : data.info.id;
        this.$value.val(value).change();
    }

    onErrorFile (event, data) {
        const msg = Jam.Helper.parseJson(data.error);
        data.$item.removeClass('pending processing').addClass('failed');
        data.$item.find(this.fileMessageSelector).text((msg && msg.file) || data.error);
    }

    onConfirmFileDeletion (event, data) {
        const message = this.$uploader.data('deletionConfirm');
        const deferred = message ? Jam.dialog.confirmDeletion(message) : $.Deferred().resolve();
        deferred.then(() => data.delete());
    }

    onDeleteFile (event, {info}) {
        if (info) {
            this.$value.val(Jam.Helper.removeCommaValue(info.id, this.$value.val()));
            if (this.uploader.options.delete) {
                $.post(this.uploader.options.delete, {id: info.id});
            }
        }
    }

    onSaveFile (event, data) {
        data.$item.removeClass('pending').addClass('saved');
        let name = data.file.name;
        let download = this.uploader.options.download;
        if (download) {
            name = `<a href="${download}${data.file.id}" target="_blank">${data.file.name}</a>`;
        }
        data.$item.find('.uploader-filename').html(`${name} (${data.file.size})`);
        data.$item.find(this.fileMessageSelector).html(data.file.message);
        const preview = this.uploader.options.preview;
        if (data.file.isImage && preview) {
            data.$item.addClass('preview');
            data.$item.find('.uploader-preview').css('background-image', `url(${preview}${data.file.id})`);
        }
    }
};