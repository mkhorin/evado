/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('../component/base/CrudController');

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
        let query = this.createModel().findByTarget(this.getQueryParam('target'));
        let models = await query.and({author: this.user.getId()}).all();
        this.sendJson({data: models.map(model => model.getAttrMap())});
    }

    async actionInlineCreate () {
        let model = this.createModel();
        model.load(this.getPostParams());
        model.set('author', this.user.getId());
        return await model.save()
            ? this.sendJson(model.getAttrMap())
            : this.handleError(model);
    }

    async actionInlineUpdate () {
        let model = await this.getModel();
        return await model.load(this.getPostParams()).save()
            ? this.sendJson(model.getAttrMaps())
            : this.handleError(model);
    }
};
module.exports.init(module);