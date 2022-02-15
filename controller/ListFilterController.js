/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('../component/base/CrudController');

module.exports = class ListFilterController extends Base {

    static getConstants () {
        return {
            METHODS: {
                'inlineList': 'get',
                'inlineCreate': 'post',
                'inlineUpdate': 'post'
            }
        };
    }

    async actionInlineList () {
        const query = this.createModel().findByTarget(this.getQueryParam('target'));
        const author = this.user.getId();
        const models = await query.and({author}).all();
        this.sendJson({
            data: models.map(model => model.getAttrMap())
        });
    }

    async actionInlineCreate () {
        const model = this.createModel();
        model.load(this.getPostParams());
        model.set('author', this.user.getId());
        return await model.save()
            ? this.sendJson(model.getAttrMap())
            : this.handleError(model);
    }

    async actionInlineUpdate () {
        const model = await this.getModel();
        return await model.load(this.getPostParams()).save()
            ? this.sendJson(model.getAttrMaps())
            : this.handleError(model);
    }
};
module.exports.init(module);