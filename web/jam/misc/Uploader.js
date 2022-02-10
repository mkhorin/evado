/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 *
 * Events:
 * uploader:error
 * uploader:select - select new files
 * uploader:overflow - select too many files
 * uploader:finish - all files uploaded
 * uploader:file:append - new uploader item cloned
 * uploader:file:validate - item validate
 * uploader:file:start - start upload
 * uploader:file:progress - progress upload - percents
 * uploader:file:upload - file uploaded
 * uploader:file:confirmDeletion - delete file after user confirmation
 * uploader:file:delete - delete file
 */
Jam.Uploader = class Uploader {

    static create ($uploader, options) {
        return $uploader.data('uploader') || new Jam.Uploader($uploader, options);
    }

    static getDefaultOptions () {
        return {
            maxFiles: 1,
            minSize: 1,
            maxSize: null,
            extensions: null,
            types: null,
            tooSmall: 'File size cannot be smaller than {limit}',
            tooBig: 'File size cannot exceed {limit}',
            wrongExtension: 'Only these file extensions are allowed: {extensions}',
            wrongType: 'Only these media types are allowed: {types}',
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
            deletionConfirm: null,
            deletionConfirmStatuses: ['done', 'uploading'],
            upload: 'file/upload', // or function
            delete: 'file/delete', // or function
            doneMessage: 'Upload completed',
            failedMessage: 'Upload failed',
            abortedMessage: 'Upload aborted',
            uploadMethod: 'POST',
            prepareUploadData: data => data
        };
    }

    constructor ($uploader, options) {
        this.$uploader = $uploader;
        this.$uploader.data('uploader', this);
        this.options = {
            ...Jam.Uploader.getDefaultOptions(),
            ...$uploader.data('options'),
            ...options
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
        let {accept, types} = this.options;
        if (!accept && types) {
            accept = types.join();
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
        // $dropZone.addClass('drag');
        return false;
    }

    onDragLeave () {
        // $dropZone.removeClass('drag');
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
            for (const file of Array.from(files)) {
                this.files.push(new Jam.UploaderFile(file, this));
            }
            this.hideDropZone(counter.total);
            Jam.Helper.resetFormElement(this.$input);
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
        }, 300);
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