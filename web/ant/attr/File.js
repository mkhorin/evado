'use strict';

Ant.ModelAttr.File = class extends Ant.ModelAttr {

    init () {
        this.$uploader = this.$attr.find('.uploader');
        this.fileMessageSelector = '.uploader-message';
        this.uploader = Ant.FileUploader.create(this.$uploader);
        this.$uploader.on('uploader.selected', this.handleSelectedFile.bind(this));
        this.$uploader.on('uploader.overflow', this.handleOverflowFile.bind(this));
        this.$uploader.on('uploader.file.appended', this.handleAppendedFile.bind(this));
        this.$uploader.on('uploader.file.validated', this.handleValidatedFile.bind(this));
        this.$uploader.on('uploader.file.started', this.handleStartedFile.bind(this));
        this.$uploader.on('uploader.file.progress', this.handleProgressFile.bind(this));
        this.$uploader.on('uploader.file.uploaded', this.handleUploadedFile.bind(this));
        this.$uploader.on('uploader.file.error', this.handleErrorFile.bind(this));
        this.$uploader.on('uploader.file.confirmRemove', this.handleConfirmRemove.bind(this));
        this.$uploader.on('uploader.file.saved', this.handleSavedFile.bind(this));
        this.initValue();
    }

    initValue () {
        let values = Ant.Helper.parseJson(this.$value.val());
        if (values instanceof Array) {
            for (let value of values) {
                this.uploader.setSavedFile(value);
            }
            this.$value.val(values.map(value => value.id).join(','));
        }
    }

    handleSelectedFile (event, data) {
        this.$uploader.find('.uploader-overflow').hide();
    }

    handleOverflowFile (event, data) {
        this.$uploader.find('.uploader-overflow').text(data).show();
    }

    handleAppendedFile (event, data) {
        data.$item.find('.uploader-filename')
            .text(`${data.file.name} (${Ant.FormatHelper.asBytes(data.file.size)})`);
    }

    handleValidatedFile (event, data) {
        if (data.image) {
            data.$item.addClass('thumb');
            data.$item.find('.uploader-thumb').css('background-image', `url(${data.image.src})`);
        }
    }

    handleStartedFile (event, data) {
        data.$item.removeClass('pending').addClass('processing');
        data.$item.find(this.fileMessageSelector).text('Uploading...');
    }

    handleProgressFile (event, data) {
        data.$item.find('.progress-bar').css('width', `${data.percent}%`);
    }

    handleUploadedFile (event, data) {
        data.info = Ant.Helper.parseJson(data.info) || {};
        data.$item.removeClass('pending processing').addClass('done');
        data.$item.find(this.fileMessageSelector).html(data.info.message);
        this.$value.val(Ant.Helper.addCommaValue(data.info.id, this.$value.val()));
    }

    handleErrorFile (event, data) {
        let msg = Ant.Helper.parseJson(data.error);
        data.$item.removeClass('pending processing').addClass('failed');
        data.$item.find(this.fileMessageSelector).text((msg && msg.file) || data.error);
    }

    handleConfirmRemove (event, data) {
        if (Ant.Helper.confirm(this.$uploader.data('removeConfirm'))) {
            data.remove();
            this.$value.val(Ant.Helper.removeCommaValue(data.info.id, this.$value.val()));
            if (this.$uploader.data('remove')) {
                $.post(this.$uploader.data('remove'), {id: data.info.id});
            }
        }
    }

    handleSavedFile (event, data) {
        data.$item.removeClass('pending').addClass('saved');
        let name = data.file.name;
        let download = this.$uploader.data('download');
        if (download) {
            name = `<a href="${download}${data.file.id}" target="_blank">${data.file.name}</a>`;
        }
        data.$item.find('.uploader-filename').html(`${name} (${data.file.size})`);
        data.$item.find(this.fileMessageSelector).html(data.file.message);
        let preview = this.$uploader.data('preview');
        if (data.file.isImage && preview) {
            data.$item.addClass('thumb');
            data.$item.find('.uploader-thumb').css('background-image', `url(${preview}${data.file.id})`);
        }
    }
};