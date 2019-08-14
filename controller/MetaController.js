/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('../component/base/BaseController');

module.exports = class MetaController extends Base {

    constructor (config) {
        super(config);
        this.meta = this.module.getMetaHub();
    }

    actionListClassSelect () {
        const meta = this.meta.get('document');
        this.sendJson(MetaSelectHelper.getLabelItems(meta.classes));
    }

    actionListViewSelect () {
        const cls = this.getClassFromRequest();
        this.sendJson(MetaSelectHelper.getLabelItems(cls.views));
    }

    actionListAttrSelect () {
        const cls = this.getClassFromRequest();
        const view = cls.getView(this.getPostParam('view')) || cls;
        this.sendJson(MetaSelectHelper.getLabelItems(view.attrs));
    }

    actionListObjectSelect () {
        const cls = this.getClassFromRequest();
        const view = cls.getView(this.getPostParam('view')) || cls;
        return this.sendSelectList(view.find());
    }

    actionListNavSectionSelect () {
        const meta = this.meta.get('navigation');
        this.sendJson(MetaSelectHelper.getLabelItems(meta.sections.values()));
    }

    actionListNavNodeSelect () {
        const meta = this.meta.get('navigation');
        const section = meta.getSection(this.getPostParam('navSection'));
        if (!section) {
            throw new NotFound('Navigation section not found');
        }
        const items = section.nodes.filter(item => !item.system);
        this.sendJson(MetaSelectHelper.getLabelItems(items));
    }

    actionListStateSelect () {
        const cls = this.getClassFromRequest();
        this.sendJson(MetaSelectHelper.getLabelItems(cls.states));
    }

    actionListTransitionSelect () {
        const cls = this.getClassFromRequest();
        this.sendJson(MetaSelectHelper.getLabelItems(cls.transitions));
    }
    
    // METHODS

    getClassFromRequest () {
        const meta = this.meta.get('document');
        const cls = meta.getClass(this.getPostParam('class'));
        if (!cls) {
            throw new NotFound('Class not found');
        }
        return cls;
    }
};
module.exports.init(module);

const NotFound = require('areto/error/NotFoundHttpException');
const MetaSelectHelper = require('../component/helper/MetaSelectHelper');