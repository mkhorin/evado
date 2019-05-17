'use strict';

module.exports = {

    //mountPath: '/test',
    port: 3000,

    components: {
        'logger': {
            level: 'info',
            types: { // optional: separate storage of error logs
                'error': {
                    store: require('areto/log/FileLogStore')
                }
            }
        },
        'view': {
        },
        'connection': {
            schema: 'mongodb',
            settings: {
                'host': process.env.MONGO_HOST || 'localhost',
                'port': process.env.MONGO_PORT || 27017,
                'database': process.env.MONGO_NAME || 'demo',
                'user': '',
                'password': '',
                'options': {
                    bufferMaxEntries: 0,
                    keepAlive: true,
                    useNewUrlParser: true
                }
            }
        },
        'cookie': {
            secret: 'evado'
        },
        'session': {
            secret: 'evado',
            lifetime: 3600
        },
        'i18n': {
        },
        'formatter': {
            Class: require('../component/misc/Formatter')
        },
        'bodyParser': {
            limit: '10mb'
        },
        'scheduler': {
        },
        'rateLimit': {
            attempts: 3
        },
        'rbac': {
            Class: require('../component/rbac/Rbac')
        },
        'router': {
            errors: {Controller: require('../controller/DefaultController')}
        },
        'user': {
            Class: require('../component/user/User'),
            WebUser: require('../component/user/WebUser'),
            UserModel: require('../model/User'),
            UserLog: require('../model/UserLog'),
            loginUrl: '/auth/sign-in',
            returnUrl: '/',
            enableAutoLogin: true,
            identityCookie: {
                httpOnly: true,
                path: '/'
            }
        },
        'meta': {
            Class: require('../component/meta/MetaHub'),
            UserModel: require('../model/User'),
            DataHistoryModel: require('../model/DataHistory'),
            rbacTablePrefix: 'sys_rbac_',
            inspectionEnabled: true
        },
        'fileStorage': require('./default-fileStorage')
    },
    modules: {
    },
    params: {
        'template': {
            engine: require('areto-ejs'),
            extension: 'ejs'
        },
        'static': {},
        'metaRoot': 'meta'
    },
    metaModels: {
        'doc': {Class: require('evado-meta-doc/base/DocMetaModel')},
        'nav': {Class: require('evado-meta-nav/base/NavMetaModel')}
    },
    assets: require('./default-assets'),
    classes: require('./default-classes'),
    widgets: {
        'globalMenu': {
            Class: require('../component/widget/GlobalMenu')            
        }
    }
};