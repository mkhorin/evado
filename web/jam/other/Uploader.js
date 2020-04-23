/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

// EVENTS

// uploader:error
// uploader:select - select new files
// uploader:overflow - select too many files
// uploader:finish - all files uploaded

// uploader:file:append - new uploader item cloned
// uploader:file:validate - item validate
// uploader:file:start - start upload
// uploader:file:progress - progress upload - percents
// uploader:file:upload - file uploaded
// uploader:file:confirmDeletion - delete file after user confirmation
// uploader:file:delete - delete file

Jam.Uploader = class Uploader {

    static create ($uploader) {
        return $uploader.data('uploader') || new Jam.Uploader($uploader);
    }

    static getDefaultOptions () {
        return {
            maxFiles: 1,
            minSize: 1,
            maxSize: null,
            extensions: null,
            mimeTypes: null,
            tooSmall: 'File size cannot be smaller than {limit}',
            tooBig: 'File size cannot exceed {limit}',
            wrongExtension: 'Only these file extensions are allowed: {extensions}',
            wrongMimeType: 'Only these file MIME types are allowed: {mimeTypes}',
            imageOnly: false,
            maxHeight: null,
            maxWidth: null,
            minHeight: 1,
            minWidth: 1,
            notImage: 'File is not an image',
            overHeight: 'Height cannot be larger than {limit} px',
            overWidth: 'Width cannot be larger than {limit} px',
            underHeight: 'Height cannot be smaller than {limit} px',
            underWidth: 'Width cannot be smaller than {limit} px',
            tooMany: 'Too many files',
            alreadyExists: 'This file has already been selected',
            deletionConfirmStatuses: ['done', 'uploading'],
            attrName: 'file',
            upload: 'file/upload',
            delete: 'file/delete',
            doneMessage: 'Upload done',
            failedMessage: 'Upload failed'

        };
    }

    constructor ($uploader) {
        this.$uploader = $uploader;
        this.$uploader.data('uploader', this);
        this.options = {
            ...Jam.Uploader.getDefaultOptions(),
            ...$uploader.data('options')
        };
        this.files = [];
        this.$input = $uploader.find('[type="file"]');
        this.init();
    }

    init () {
        this.initDropZone();
        this.setInputAccept();
        if (this.options.maxFiles > 1) {
            this.$input.attr('multiple', true);
        }
        this.$input.change(event => this.setFiles(event.target.files));
    }

    setInputAccept () {
        let {accept, mimeTypes} = this.options;
        if (!accept && mimeTypes) {
            accept = mimeTypes.join();
        }
        if (accept) {
            this.$input.attr('accept', accept);
        }
    }

    initDropZone () {
        this.$dropzone = this.$uploader.find(".uploader-dropzone");
        const dropzone = this.$dropzone.get(0);
        dropzone.ondragover = this.onDragOver.bind(this);
        dropzone.ondragleave = this.onDragLeave.bind(this);
        dropzone.ondrop = this.onDrop.bind(this);
        dropzone.onclick = this.onClickDropZone.bind(this);
        this.hideDropZone(0);
    }

    on (eventName, handler, data) {
        this.$uploader.on(`uploader:${eventName}`, handler, data);
    }

    trigger (eventName, data) {
        this.$uploader.trigger(`uploader:${eventName}`, data);
    }

    onDragOver () {
        //$dropZone.addClass('drag');
        return false;
    }

    onDragLeave () {
        //$dropZone.removeClass('drag');
        return false;
    }

    onDrop (event) {
        event.preventDefault();
        this.setFiles(event.dataTransfer.files);
        return false;
    }

    onClickDropZone () {
        this.$input.click();
    }

    isProcessing () {
        for (const file of this.files) {
            if (file.isProcessing()) {
                return true;
            }
        }
    }

    abort () {
        for (const file of this.files) {
            file.abort();
        }
    }

    setFiles (files) {
        const counter = this.count();
        counter.total += files.length;
        if (counter.total > Number(this.options.maxFiles)) {
            return this.trigger('overflow', this.options.tooMany);
        }
        if (files.length) {
            for (let i = 0; i < files.length; ++i) { // 'of' not work
                this.files.push(new Jam.UploaderFile(files[i], this));
            }
            this.hideDropZone(counter.total);
            this.$input.wrap('<form>').closest('form').get(0).reset();
            this.$input.unwrap();
            this.trigger('select', counter);
            this.processNext();
        }
    }

    hideDropZone (total) {
        if (Number(total) >= Number(this.options.maxFiles)) {
            this.toggleDropZone(false);
        }
    }

    toggleDropZone (state) {
        this.$uploader.toggleClass('show-dropzone', state);
    }

    count () {
        const counter = {
            total: 0,
            failed: 0,
            done: 0
        };
        for (const file of this.files) {
            if (!file.deleted) {
                if (file.failed) {
                    ++counter.failed;
                } else if (file.isDone()) {
                    ++counter.done;
                }
                ++counter.total;
            }
        }
        return counter;
    }

    processNext () {
        setTimeout(()=> {
            const data = this.getFirstFilesByStatus();
            if (data.hasOwnProperty('pending')) {
                data.pending.append();
            } else if (data.hasOwnProperty('appended')) {
                data.appended.validate();
            } else if (data.hasOwnProperty('validated') && !data.hasOwnProperty('uploading')) {
                data.validated.upload();
            }
        }, 100);
    }

    getFirstFilesByStatus () {
        const result = {};
        for (const file of this.files) {
            if (!file.deleted && !file.failed && !result.hasOwnProperty(file.status)) {
                result[file.status] = file;
            }
        }
        return result;
    }

    setSavedFile (data) {
        const counter = this.count();
        this.hideDropZone(counter.total + 1);
        const file = new Jam.UploaderFile(data, this);
        file.setSaved();
        this.files.push(file);
    }
};

Jam.UploaderFile = class UploaderFile {

    constructor (file, uploader) {
        this.failed = false;
        this.deleted = false;
        this.status = 'pending';
        this.file = file;
        this.uploader = uploader;
    }

    trigger (eventName) {
        this.uploader.trigger(`file:${eventName}`, this);
    }

    isDone () {
        return this.status === 'done';
    }

    isProcessing () {
        return !this.deleted && !this.failed && !this.isDone();
    }

    setSaved () {
        this.status = 'done';
        this.info = this.file;
        this.buildItem();
        this.trigger('append');
        this.trigger('save');
    }

    setError (error) {
        if (error) {
            this.failed = true;
            this.error = error;
            this.trigger('error');
        }
    }

    abort () {
        if (this.xhr) {
            this.xhr.abort();
        }
    }

    delete () {
        this.deleted = true;
        if (this.$item) {
            this.$item.remove();
        }
        this.abort();
        this.uploader.toggleDropZone(true);
        this.trigger('delete');
    }

    // APPEND

    buildItem () {
        this.$item = this.uploader.$uploader.find('.sample').clone().removeClass('sample').show();
        this.uploader.$uploader.find('.uploader-list').prepend(this.$item);
        this.$item.data('file', this).find('.uploader-delete').click(this.onDeleteFile.bind(this));
    }

    onDeleteFile () {
        this.failed || !this.uploader.options.deletionConfirmStatuses.includes(this.status)
            ? this.delete()
            : this.trigger('confirmDeletion');
    }

    append () {
        this.buildItem();
        this.status = 'appended';
        this.trigger('append');
        this.uploader.processNext();
    }

    // VALIDATE

    validate () {
        this.image = new Image;
        this.image.onload = ()=> this.startValidate();
        this.image.onerror = ()=> {
            this.image = null;
            this.startValidate();
        };
        this.image.src = window.URL.createObjectURL(this.file);
    }

    startValidate () {
        const error = this.validateFile();
        this.status = 'validated';
        this.trigger('validate');
        this.setError(error);
        this.uploader.processNext();
    }

    validateFile () {
        const options = this.uploader.options;
        const file = this.file;
        if (this.isMatchFile()) {
            return this.createMessage(options.alreadyExists);
        }
        if (options.extensions) {
            const index = file.name.lastIndexOf('.');
            const ext = index > -1 ? file.name.substr(index + 1, file.name.length).toLowerCase() : '';
            if (!options.extensions.includes(ext)) {
                return this.createMessage(options.wrongExtension, {
                    extensions: options.extensions.join(', ')
                });
            }
        }
        if (options.mimeTypes && !options.mimeTypes.includes(file.type)) {
            return this.createMessage(options.wrongMimeType, {
                mimeTypes: options.mimeTypes.join(', ')
            });
        }
        if (options.maxSize && options.maxSize < file.size) {
            return this.createMessage(options.tooBig, {
                limit: Jam.FormatHelper.asBytes(options.maxSize)
            });
        }
        if (options.minSize && options.minSize > file.size) {
            return this.createMessage(options.tooSmall, {
                limit: Jam.FormatHelper.asBytes(options.tooSmall)
            });
        }
        if (options.imageOnly) {
            return this.image  ? this.validateImage() : this.createMessage(options.notImage);
        }
        if (this.image) {
            return this.validateImage();
        }
        if (options.imageOnly) {
            return this.createMessage(options.notImage);
        }
        return false;
    }

    isMatchFile () {
        const files = this.uploader.files;
        for (let i = 0; i < files.length; ++i) { // 'of' not work
            const file = files[i];
            if (!file.deleted) {
                if (file === this) { // match with previous files only
                    return false;
                }
                if (file.file.size === this.file.size && file.file.name === this.file.name) {
                    return true;
                }
            }
        }
        return false;
    }

    validateImage () {
        const options = this.uploader.options;
        if (options.maxHeight && options.maxHeight < this.image.height) {
            return this.createMessage(options.overHeight, {limit: options.maxHeight});
        }
        if (options.maxWidth && options.maxWidth < this.image.width) {
            return this.createMessage(options.overWidth, {limit: options.maxWidth});
        }
        if (options.minHeight && options.minHeight > this.image.height) {
            return this.createMessage(options.underHeight, {limit: options.minHeight});
        }
        if (options.minWidth && options.minWidth > this.image.width) {
            return this.createMessage(options.underWidth, {limit: options.minWidth});
        }
        return false;
    }

    createMessage (message, params = {}) {
        message = Jam.i18n.translate(message);
        for (const key of Object.keys(params)) {
            message = message.replace(new RegExp(`{${key}}`, 'g'), params[key]);
        }
        return message;
    }

    // UPLOAD

    upload () {
        this.xhr = new XMLHttpRequest;
        this.xhr.open('POST', this.uploader.options.upload);
        if (this.xhr.upload) {
            this.xhr.upload.addEventListener('progress', this.progressUploading.bind(this), false);
        }
        this.xhr.onreadystatechange = this.changeReadyState.bind(this);
        const data = new FormData;
        data.append(this.uploader.options.attrName, this.file.name);
        data.append(this.uploader.options.attrName, this.file);
        this.status = 'uploading';
        this.trigger('start');
        this.xhr.send(data);
    }

    progressUploading (event) {
        // can be FALSE if server never sent Content-Length header to response
        if (event.lengthComputable) {
            this.percent = Math.round(event.loaded * 100 / event.total);
            this.trigger('progress');
        }
    }

    changeReadyState () {
        if (this.xhr.readyState === 4) {
            const message = this.xhr.response;
            if (this.xhr.status === 200) {
                this.status = 'done';
                this.info = message || this.uploader.doneMessage;
                this.trigger('upload');
            } else {
                this.setError(message || this.uploader.failedMessage);
            }
            this.uploader.processNext();
        }
    }
};