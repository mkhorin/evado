/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
Jam.UploaderFile = class UploaderFile {

    constructor (file, uploader) {
        this.failed = false;
        this.deleted = false;
        this.status = 'pending';
        this.file = file;
        this.uploader = uploader;
        this.options = uploader.options;
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

    getDeleteUrl () {
        return this.resolveUrl(this.options.delete);
    }

    getUploadUrl () {
        return this.resolveUrl(this.options.upload);
    }

    resolveUrl (url) {
        return typeof url === 'function' ? url(this) : url;
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
        this.xhr?.abort();
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

    buildItem () {
        this.$item = this.uploader.$uploader.find('.sample').clone();
        this.$item.removeClass('sample').show();
        this.uploader.$uploader.find('.uploader-list').prepend(this.$item);
        this.$item.data('file', this);
        this.$item.find('.uploader-delete').click(this.onDeleteFile.bind(this));
    }

    onDeleteFile () {
        this.failed || !this.options.deletionConfirmStatuses.includes(this.status)
            ? this.delete()
            : this.trigger('confirmDeletion');
    }

    append () {
        this.buildItem();
        this.status = 'appended';
        this.trigger('append');
        this.uploader.processNext();
    }

    validate () {
        this.image = new Image;
        this.image.addEventListener('load', this.onLoadImage.bind(this));
        this.image.addEventListener('error', this.onErrorImage.bind(this));
        this.image.src = window.URL.createObjectURL(this.file);
    }

    onLoadImage () {
        this.startValidate();
    }

    onErrorImage () {
        this.image = null;
        this.startValidate();
    }

    startValidate () {
        const error = this.validateFile();
        this.status = 'validated';
        this.trigger('validate');
        this.setError(error);
        this.uploader.processNext();
    }

    validateFile () {
        const {file, options} = this;
        if (this.isMatchFile()) {
            return this.createMessage(options.alreadyExists);
        }
        if (options.extensions) {
            const index = file.name.lastIndexOf('.');
            const extension = index !== -1
                ? file.name.substr(index + 1, file.name.length).toLowerCase()
                : '';
            if (!options.extensions.includes(extension)) {
                return this.createMessage(options.wrongExtension, {
                    extensions: options.extensions.join(', ')
                });
            }
        }
        if (options.types && !options.types.includes(file.type)) {
            return this.createMessage(options.wrongType, {
                types: options.types.join(', ')
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
            return this.image
                ? this.validateImage()
                : this.createMessage(options.notImage);
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
        const items = Array.from(this.uploader.files);
        for (const item of items) {
            if (item.deleted) {
                continue;
            }
            if (item === this) { // match with previous files only
                return false;
            }
            if (item.file.size === this.file.size) {
                if (item.file.name === this.file.name) {
                    return true;
                }
            }
        }
        return false;
    }

    validateImage () {
        const {options} = this;
        if (options.maxHeight && options.maxHeight < this.image.height) {
            return this.createMessage(options.overHeight, {
                limit: options.maxHeight
            });
        }
        if (options.maxWidth && options.maxWidth < this.image.width) {
            return this.createMessage(options.overWidth, {
                limit: options.maxWidth
            });
        }
        if (options.minHeight && options.minHeight > this.image.height) {
            return this.createMessage(options.underHeight, {
                limit: options.minHeight
            });
        }
        if (options.minWidth && options.minWidth > this.image.width) {
            return this.createMessage(options.underWidth, {
                limit: options.minWidth
            });
        }
        return false;
    }

    createMessage (message, params = {}) {
        message = Jam.t(message);
        for (const key of Object.keys(params)) {
            const regex = new RegExp(`{${key}}`, 'g');
            message = message.replace(regex, params[key]);
        }
        return message;
    }

    upload () {
        $.when(this.getUploadUrl())
            .then(this.onStartUpload.bind(this))
            .catch(this.onError.bind(this));
    }

    onStartUpload (url) {
        this.xhr = new XMLHttpRequest;
        this.xhr.open(this.options.uploadMethod, url);
        this.xhr.upload?.addEventListener('progress', this.onProgress.bind(this), false);
        this.xhr.addEventListener('load', this.onLoad.bind(this));
        this.xhr.addEventListener('error', this.onError.bind(this));
        this.xhr.addEventListener('abort', this.onAbort.bind(this));
        let data = new FormData;
        data.append('file', this.file.name);
        data.append('file', this.file);
        data = this.options.prepareUploadData(data, this);
        this.status = 'uploading';
        this.trigger('start');
        this.xhr.send(data);
    }

    onProgress (event) {
        // can be FALSE if server never sent Content-Length header to response
        if (event.lengthComputable) {
            this.percent = Math.round(event.loaded * 100 / event.total);
            this.trigger('progress');
        }
    }

    onLoad () {
        const message = this.xhr.response;
        if (this.xhr.status === 200) {
            this.status = 'done';
            this.info = message || this.options.doneMessage;
            this.trigger('upload');
        } else {
            this.setError(message || this.options.failedMessage);
        }
        this.uploader.processNext();
    }

    onError (data) {
        this.setError(data || this.options.failedMessage);
        this.uploader.processNext();
    }

    onAbort () {
        this.setError(this.options.abortedMessage);
        this.uploader.processNext();
    }
};