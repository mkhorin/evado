/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

Jam.ModelTools = class {

    constructor (model) {
        this.$tools = model.$container.find('.model-tools');
        if (this.$tools.length) {
            this.model = model;
            this.$loader = this.$tools.find('.loader');
            this.$alert = this.$tools.find('.alert');
            this.$tools.on('click', 'button', event => this.execute($(event.currentTarget)));
        }
    }

    isLoading () {
        return this.$tools.hasClass('loading');
    }

    toggleLoading (state) {
        this.$tools.toggleClass('loading', state);
    }

    alertSuccess (data) {
        this.$alert.removeAttr('class');
        this.$alert.addClass('alert alert-success').html(data).show();
    }

    alertFail (data) {
        this.$alert.removeAttr('class');
        this.$alert.addClass('alert alert-danger').html(data).show();
    }

    execute ($elem) {
        this.$alert.hide();
        if (this.isLoading()) {
            return false;
        }
        let name = $elem.data('handler');
        name = 'handler' + (name ? Jam.StringHelper.toFirstUpperCase(name) : 'Default');
        let handler = this[name]($elem);
        if (handler && handler.fail && handler.always) {
            handler.fail(xhr => this.alertFail(xhr.responseText));
            handler.always(()=> this.toggleLoading(false));
        }
    }

    handlerDefault ($elem) {
        this.toggleLoading(true);
        return $.post($elem.data('url')).done(data => this.alertSuccess(data));
    }
};