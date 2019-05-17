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
        let model = this.meta.getModel('doc').getClass(name);
        if (!model) {
            throw new NotFound('Not found class');
        }
        await this.meta.process(async ()=> await model.updateIndexes());
        this.send('Class indexes have been updated');
    }

    // LIST META

    actionListClassSelect () {
        let metaModel = this.meta.getModel('doc');
        this.sendJson(MetaSelectHelper.getLabelItems(metaModel.classes));
    }

    actionListViewSelect () {
        let cls = this.getClassFromQuery();
        this.sendJson(MetaSelectHelper.getLabelItems(cls.views));
    }

    actionListAttrSelect () {
        let cls = this.getClassFromQuery();
        let view = cls.getView(this.getQueryParam('view')) || cls;        
        this.sendJson(MetaSelectHelper.getLabelItems(view.attrs));
    }

    async actionListObjectSelect () {
        let cls = this.getClassFromQuery();
        let view = cls.getView(this.getQueryParam('view')) || cls;
        let models = await view.find().all();
        this.sendJson(models.map(item => ({
            value: item.getId(),
            text: item.getId()
        })));
    }

    actionListNavSectionSelect () {
        let metaModel = this.meta.getModel('nav');
        this.sendJson(MetaSelectHelper.getLabelItems(metaModel.sections.values()));
    }

    actionListNavItemSelect () {
        let metaModel = this.meta.getModel('nav');
        let section = metaModel.getSection(this.getQueryParam('navSection'));
        if (!section) {
            throw new NotFound('Not found nav section');
        }
        this.sendJson(MetaSelectHelper.getLabelItems(section.items.values()));
    }

    actionListStateSelect () {
        let cls = this.getClassFromQuery();
        this.sendJson(MetaSelectHelper.getLabelItems(cls.states));
    }

    actionListTransitionSelect () {
        let cls = this.getClassFromQuery();
        this.sendJson(MetaSelectHelper.getLabelItems(cls.transitions));
    }
    
    // METHODS

    getClassFromQuery () {
        let metaModel = this.meta.getModel('doc');
        let cls = metaModel.getClass(this.getQueryParam('class'));
        if (!cls) {
            throw new NotFound('Not found class');
        }
        return cls;
    }

    getMetaModelFromQuery () {
        let model = this.meta.getModel(this.getQueryParam('meta'));
        if (!model) {
            throw new NotFound('Not found meta model');
        }
        return model;
    }
};
module.exports.init(module);

const NotFound = require('areto/error/NotFoundHttpException');
const MetaSelectHelper = require('../component/helper/MetaSelectHelper');