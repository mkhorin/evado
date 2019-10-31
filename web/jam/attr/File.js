/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

Jam.ModelAttrFile = class ModelAttrFile extends Jam.ModelAttr {

    constructor () {
        super(...arguments);
        this.events = new Jam.Events(this.constructor.name);
    }

    init () {
        this.$uploader = this.$attr.find('.uploader');
        this.fileMessageSelector = '.uploader-message';
        this.uploader = Jam.Uploader.create(this.$uploader);
        this.uploader.on('selected', this.onSelectedFile.bind(this));
        this.uploader.on('overflow', this.onOverflowFile.bind(this));
        this.uploader.on('file:appended', this.onAppendedFile.bind(this));
        this.uploader.on('file:validated', this.onValidatedFile.bind(this));
        this.uploader.on('file:started', this.onStartedFile.bind(this));
        this.uploader.on('file:progress', this.onProgressFile.bind(this));
        this.uploader.on('file:uploaded', this.onUploadedFile.bind(this));
        this.uploader.on('file:error', this.onErrorFile.bind(this));
        this.uploader.on('file:confirmRemove', this.onConfirmFileRemove.bind(this));
        this.uploader.on('file:remove', this.onRemoveFile.bind(this));
        this.uploader.on('file:saved', this.onSavedFile.bind(this));
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

    onSelectedFile () {
        this.$uploader.find('.uploader-overflow').hide();
    }

    onOverflowFile (event, data) {
        this.$uploader.find('.uploader-overflow').text(data).show();
    }

    onAppendedFile (event, data) {
        data.$item.find('.uploader-filename').text(`${data.file.name} (${Jam.FormatHelper.asBytes(data.file.size)})`);
        this.events.trigger('appended', data);
    }

    onValidatedFile (event, data) {
        if (data.image) {
            data.$item.addClass('thumb');
            data.$item.find('.uploader-thumb').css('background-image', `url(${data.image.src})`);
        }
    }

    onStartedFile (event, data) {
        data.$item.removeClass('pending').addClass('processing');
        data.$item.find(this.fileMessageSelector).text('Uploading...');
    }

    onProgressFile (event, data) {
        data.$item.find('.progress-bar').css('width', `${data.percent}%`);
    }

    onUploadedFile (event, data) {
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

    onConfirmFileRemove (event, data) {
        const message = this.$uploader.data('removeConfirm');
        if (message) {
            Jam.dialog.confirmRemove(message).then(()=> data.remove());    
        }
    }

    onRemoveFile (event, {info}) {
        if (info) {
            this.$value.val(Jam.Helper.removeCommaValue(info.id, this.$value.val()));
            if (this.uploader.options.remove) {
                $.post(this.uploader.options.remove, {id: info.id});
            }
        }
    }

    onSavedFile (event, data) {
        data.$item.removeClass('pending').addClass('saved');
        let name = data.file.name;
        let download = this.uploader.options.remove;
        if (download) {
            name = `<a href="${download}${data.file.id}" target="_blank">${data.file.name}</a>`;
        }
        data.$item.find('.uploader-filename').html(`${name} (${data.file.size})`);
        data.$item.find(this.fileMessageSelector).html(data.file.message);
        const preview = this.uploader.options.preview;
        if (data.file.isImage && preview) {
            data.$item.addClass('thumb');
            data.$item.find('.uploader-thumb').css('background-image', `url(${preview}${data.file.id})`);
        }
    }
};