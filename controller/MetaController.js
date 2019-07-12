/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('../component/base/BaseController');

module.exports = class MetaController extends Base {

    static getConstants () {
        return {
            METHODS: {
                'reload': 'post',
                'update-indexes': 'post'
            }
        };
    }

    constructor (config) {
        super(config);
        this.meta = this.module.getMeta();
    }

    async actionReload () {
        await this.meta.reload();
        this.send('Metadata has been reloaded');
    }

    async actionUpdateIndexes () {
        await this.meta.process(async ()=> await this.meta.updateIndexes());
        return this.send('Indexes have been updated');
    }

    async actionUpdateClassIndexes () {
        let name = this.getQueryParam('class');
        let model = this.meta.getModel('document').getClass(name);
        if (!model) {
            throw new NotFound('Not found class');
        }
        await this.meta.process(async ()=> await model.updateIndexes());
        this.send('Class indexes have been updated');
    }

    actionListClassSelect () {
        let metaModel = this.meta.getModel('document');
        this.sendJson(MetaSelectHelper.getLabelItems(metaModel.classes));
    }

    actionListViewSelect () {
        let cls = this.getClassFromRequest();
        this.sendJson(MetaSelectHelper.getLabelItems(cls.views));
    }

    actionListAttrSelect () {
        let cls = this.getClassFromRequest();
        let view = cls.getView(this.getPostParam('view')) || cls;
        this.sendJson(MetaSelectHelper.getLabelItems(view.attrs));
    }

    actionListObjectSelect () {
        let cls = this.getClassFromRequest();
        let view = cls.getView(this.getPostParam('view')) || cls;
        return this.sendSelectList(view.find());
    }

    actionListNavSectionSelect () {
        let metaModel = this.meta.getModel('navigation');
        this.sendJson(MetaSelectHelper.getLabelItems(metaModel.sections.values()));
    }

    actionListNavItemSelect () {
        let metaModel = this.meta.getModel('navigation');
        let section = metaModel.getSection(this.getPostParam('navSection'));
        if (!section) {
            throw new NotFound('Not found nav section');
        }
        this.sendJson(MetaSelectHelper.getLabelItems(section.items.values()));
    }

    actionListStateSelect () {
        let cls = this.getClassFromRequest();
        this.sendJson(MetaSelectHelper.getLabelItems(cls.states));
    }

    actionListTransitionSelect () {
        let cls = this.getClassFromRequest();
        this.sendJson(MetaSelectHelper.getLabelItems(cls.transitions));
    }
    
    // METHODS

    getClassFromRequest () {
        let metaModel = this.meta.getModel('document');
        let cls = metaModel.getClass(this.getPostParam('class'));
        if (!cls) {
            throw new NotFound('Not found class');
        }
        return cls;
    }
};
module.exports.init(module);

const NotFound = require('areto/error/NotFoundHttpException');
const MetaSelectHelper = require('../component/helper/MetaSelectHelper');