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
        this.filenameSelector = '.uploader-filename';
        this.overflowSelector = '.uploader-overflow';
        this.thumbnailSelector = '.uploader-thumbnail';
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

    isRunning () {
        return this.uploader.isProcessing() ? 'Abort upload?' : false;
    }

    afterFrameClose () {
        this.uploader.abort();
    }

    onSelectFile () {
        this.$uploader.find(this.overflowSelector).hide();
    }

    onOverflowFile (event, message) {
        this.$uploader.find(this.overflowSelector).text(message).show();
    }

    onAppendFile (event, item) {
        const {name, size} = item.file;
        const bytes = Jam.FormatHelper.asBytes(size);
        const $filename = item.$item.find(this.filenameSelector);
        $filename.text(`${name} (${bytes})`);
        this.setNameAttr(name);
        this.events.trigger('append', item);
    }

    setNameAttr (value) {
        const attr = this.getNameAttr();
        if (attr) {
            attr.setValue(value);
            attr.triggerChange();
        }
    }

    onValidateFile (event, {$item, image}) {
        if (image) {
            this.setThumbnail($item, image.src);
        }
    }

    onStartFile (event, {$item}) {
        $item.removeClass('pending').addClass('processing');
        $item.find(this.fileMessageSelector).text('Uploading...');
    }

    onProgressFile (event, {$item, percent}) {
        $item.find('.progress-bar').css('width', `${percent}%`);
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

    onErrorFile (event, {$item, error}) {
        $item.removeClass('pending processing').addClass('failed');
        const data = Jam.Helper.parseJson(error);
        const message = data?.file || Jam.t(error);
        $item.find(this.fileMessageSelector).text(message);
    }

    async onConfirmFileDeletion (event, item) {
        const message = this.$uploader.data('deletionConfirm');
        if (message) {
            await Jam.dialog.confirmDeletion(message);
        }
        item.delete();
    }

    onDeleteFile (event, {id}) {
        if (id) {
            let value = this.$value.val();
            value = Jam.Helper.removeCommaValue(id, value);
            this.$value.val(value).change();
            if (this.uploader.options.delete) {
                $.post(this.uploader.options.delete, {id});
            }
        }
    }

    onSaveFile (event, {$item, file}) {
        $item.removeClass('pending').addClass('saved');
        let {name} = file;
        let {download} = this.uploader.options;
        if (download) {
            name = `<a href="${download}${file.id}" target="_blank">${file.name}</a>`;
        }
        $item.find(this.filenameSelector).html(`${name} (${file.size})`);
        $item.find(this.fileMessageSelector).html(file.message);
        if (file.isImage) {
            const {thumbnail} = this.uploader.options;
            if (thumbnail) {
                this.setThumbnail($item, `${thumbnail}${file.id}`);
            }
        }
    }

    setThumbnail ($item, url) {
        $item.find(this.thumbnailSelector).css('background-image', `url(${url})`);
        $item.addClass('with-thumbnail');
    }
};