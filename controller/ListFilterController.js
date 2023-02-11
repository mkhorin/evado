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
        const {target} = this.getQueryParams();
        const author = this.user.getId();
        const query = this.createModel().findByTarget(target).and({author});
        const models = await query.all();
        const data = models.map(model => model.getAttrMap());
        this.sendJson({data});
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
        model.load(this.getPostParams());
        return await model.save()
            ? this.sendJson(model.getAttrMap())
            : this.handleError(model);
    }
};
module.exports.init(module);