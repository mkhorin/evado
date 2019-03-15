'use strict';

const Base = require('../component/BaseController');

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
        this.send('Meta init is done');
    }

    async actionUpdateIndexes () {
        let project = this.getMetaModelProjectFromQuery('doc');
        let className = this.getQueryParam('class');
        if (!className) {
            await project.updateIndexes();
            return this.send('Project indexes have been updated');
        }
        if (!project.getClass(className)) {
            throw new NotFound('Not found class');
        }
        await project.getClass(className).updateIndexes();
        this.send('Class indexes have been updated');
    }

    // LIST META

    actionListClassSelect () {
        let project = this.getMetaModelProjectFromQuery('doc');
        this.sendJson(MetaSelectHelper.getCaptionItems(project.classes));
    }

    actionListViewSelect () {
        let cls = this.getClassFromQuery();
        this.sendJson(MetaSelectHelper.getCaptionItems(cls.views));
    }

    actionListAttrSelect () {
        let cls = this.getClassFromQuery();
        let view = cls.getView(this.getQueryParam('view')) || cls;        
        this.sendJson(MetaSelectHelper.getCaptionItems(view.attrs));
    }

    async actionListObjectSelect () {
        let cls = this.getClassFromQuery();
        let view = cls.getView(this.getQueryParam('view')) || cls;
        let models = await view.find().all();
        this.sendJson(models.map(item => ({
            'value': item.getId(),
            'text': item.getId()
        })));
    }

    actionListNavSectionSelect () {
        let project = this.getMetaModelProjectFromQuery('nav');
        this.sendJson(MetaSelectHelper.getCaptionItems(project.sections.values()));
    }

    actionListNavItemSelect () {
        let project = this.getMetaModelProjectFromQuery('nav');
        let section = project.getSection(this.getQueryParam('navSection'));
        if (!section) {
            throw new NotFound('Not found nav section');
        }
        this.sendJson(MetaSelectHelper.getCaptionItems(section.items.values()));
    }

    actionListStateSelect () {
        let cls = this.getClassFromQuery();
        this.sendJson(MetaSelectHelper.getCaptionItems(cls.states));
    }

    actionListTransitionSelect () {
        let cls = this.getClassFromQuery();
        this.sendJson(MetaSelectHelper.getCaptionItems(cls.transitions));
    }
    
    // METHODS

    getClassFromQuery () {
        let project = this.getMetaModelProjectFromQuery('doc');
        let cls = project.getClass(this.getQueryParam('class'));
        if (!cls) {
            throw new NotFound('Not found class');
        }
        return cls;
    }

    getMetaModelProjectFromQuery (metaModelName) {
        let project = this.getProjectFromQuery();
        return this.meta.getModel(metaModelName).getProject(project.name);
    }

    getProjectFromQuery () {
        let project = this.meta.getProject(this.getQueryParam('project'));
        if (!project) {
            throw new NotFound('Not found project');
        }
        return project;
    }
};
module.exports.init(module);

const NotFound = require('areto/error/NotFoundHttpException');
const MetaSelectHelper = require('../component/meta/helper/MetaSelectHelper');