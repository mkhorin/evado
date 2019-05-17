'use strict';

Ant.ModelAttr.File = class extends Ant.ModelAttr {

    init () {
        this.$uploader = this.$attr.find('.uploader');
        this.fileMessageSelector = '.uploader-message';
        this.uploader = Ant.FileUploader.create(this.$uploader);
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
        let values = Ant.Helper.parseJson(this.$value.val());
        if (Array.isArray(values)) {
            for (let value of values) {
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

    onSelectedFile (event, data) {
        this.$uploader.find('.uploader-overflow').hide();
    }

    onOverflowFile (event, data) {
        this.$uploader.find('.uploader-overflow').text(data).show();
    }

    onAppendedFile (event, data) {
        data.$item.find('.uploader-filename')
            .text(`${data.file.name} (${Ant.FormatHelper.asBytes(data.file.size)})`);
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
        data.info = Ant.Helper.parseJson(data.info) || {};
        data.$item.removeClass('pending processing').addClass('done');
        let message = Ant.I18n.translate(data.info.message || 'Upload completed');
        data.$item.find(this.fileMessageSelector).html(message);
        let value = this.uploader.options.maxFiles > 1
            ? Ant.Helper.addCommaValue(data.info.id, this.$value.val())
            : data.info.id;
        this.$value.val(value).change();
    }

    onErrorFile (event, data) {
        let msg = Ant.Helper.parseJson(data.error);
        data.$item.removeClass('pending processing').addClass('failed');
        data.$item.find(this.fileMessageSelector).text((msg && msg.file) || data.error);
    }

    onConfirmFileRemove (event, data) {
        if (Ant.Helper.confirm(this.$uploader.data('removeConfirm'))) {
            data.remove();
        }
    }

    onRemoveFile (event, data) {
        this.$value.val(Ant.Helper.removeCommaValue(data.info.id, this.$value.val()));
        if (this.uploader.options.remove) {
            $.post(this.uploader.options.remove, {id: data.info.id});
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
        let preview = this.uploader.options.preview;
        if (data.file.isImage && preview) {
            data.$item.addClass('thumb');
            data.$item.find('.uploader-thumb').css('background-image', `url(${preview}${data.file.id})`);
        }
    }
};