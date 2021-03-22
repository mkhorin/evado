/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
Jam.ModelTools = class ModelTools {

    constructor (model) {
        this.$tools = model.$container.find('.model-tools');
        if (this.$tools.length) {
            this.model = model;
            this.$loader = this.$tools.find('.loader');
            this.$alert = this.$tools.find('.alert');
            this.$tools.on('click', 'button', this.onClick.bind(this));
        }
    }

    isLoading () {
        return this.$tools.hasClass('loading');
    }

    onClick (event) {
        this.execute($(event.currentTarget));
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
        name = name ? Jam.StringHelper.capitalize(name) : 'Default';
        const handler = this[`handler${name}`]($elem);
        if (handler?.fail && handler?.always) {
            handler.fail(data => this.alertFail(data.responseText));
            handler.always(()=> this.toggleLoading(false));
        }
    }

    handlerDefault ($elem) {
        this.toggleLoading(true);
        return Jam.post($elem.data('url'))
            .done(this.alertSuccess.bind(this));
    }
};