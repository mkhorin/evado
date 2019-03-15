'use strict';

const Base = require('../component/CrudController');

module.exports = class ListFilterController extends Base {

    static getConstants () {
        return {            
            METHODS: {
                'inline-list': 'get',
                'inline-create': 'post',
                'inline-update': 'post'
            }
        };
    }

    async actionInlineList () {
        let query = this.getModelClass().findByTarget(this.getQueryParam('target'));
        let models = await query.and({
            'author': this.user.getId()
        }).all();
        this.sendJson({
            'data': models.map(model => model.getAttrs())
        });
    }

    async actionInlineCreate () {
        let model = this.createModel();
        model.load(this.getPostParams());
        model.set('author', this.user.getId());
        return await model.save()
            ? this.sendJson(model.getAttrs())
            : this.handleError(model);
    }

    async actionInlineUpdate () {
        let model = await this.getModel();
        return await model.load(this.getPostParams()).save()
            ? this.sendJson(model.getAttrs())
            : this.handleError(model);
    }
};
module.exports.init(module);