/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

module.exports = {

    //mountPath: '/test',
    port: 3000,

    components: {
        'logger': {
            level: 'info'
        },
        'actionProfiler': {
            Class: require('areto/log/actionProfiler')
        },
        'view': {},
        'db': {
            Class: require('areto/db/MongoDatabase'),
            settings: {
                'host': process.env.MONGO_HOST || 'localhost',
                'port': process.env.MONGO_PORT || 27017,
                'database': process.env.MONGO_NAME,
                'user': '',
                'password': ''
            }
        },
        'cookie': {
            secret: 'evado-app'
        },
        'session': {
            secret: 'evado-app',
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
            Class: require('../component/scheduler/Scheduler')
        },
        'rateLimit': {
            attempts: 3
        },
        'rbac': {
            Class: require('../component/security/rbac/Rbac')
        },
        'router': {
            errors: {Controller: require('../controller/DefaultController')}
        },
        'auth': {
            Class: require('../component/security/Auth'),
            loginUrl: '/auth/sign-in',
            returnUrl: '/',
            enableAutoLogin: true,
            identityCookie: {
                'httpOnly': true,
                'path': '/'
            },
            Identity: require('../model/User')
        },
        'metaHub': {
            Class: require('../component/meta/MetaHub'),            
            rbacTablePrefix: 'sys_rbac_',
            inspectionEnabled: true
        },
        'notifier': {
            Class: require('../component/notifier/Notifier'),
        },
        'observer': {
            Class: require('../component/observer/Observer'),
        },
        'mailer': {
            Class: require('../component/mailer/Mailer'),
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
        'allowSignUp': true
    },
    metaModels: {
        'document': {
            Class: require('evado-meta-document/base/DocMeta')
        },
        'navigation': {
            Class: require('evado-meta-navigation/base/NavMeta')
        },
        'report': {
            Class: require('evado-meta-report/base/ReportMeta')
        }
    },
    assets: require('./default-assets'),
    classes: require('./default-classes'),
    tasks: require('./default-tasks'),
    widgets: {
        'commonMenu': {
            Class: require('../component/widget/CommonMenu')
        },
        'notificationToggle': {
            Class: require('../component/widget/NotificationToggle')
        },
        'notifications': {
            Class: require('../component/widget/Notifications')
        },
        'user': {
            Class: require('../component/widget/UserWidget')
        }
    },
};