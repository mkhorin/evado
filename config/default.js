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
            sources: {
                'mail': {forceTranslation: true}
            }
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
            }
        },
        'metaHub': {
            Class: require('../component/meta/MetaHub'),            
            rbacTablePrefix: 'sys_rbac_',
            inspectionEnabled: true
        },
        'notifier': {
            Class: require('../component/notifier/Notifier'),
            tasks: ['sendNoticeMessage']
        },
        'observer': {
            Class: require('../component/observer/Observer'),
        },
        'mailer': {
            Class: require('../component/mailer/DummyMailer')
        },
        'fileStorage': require('./default-fileStorage')
    },
    modules: {
        'api': {
            Class: require('evado/module/api/Module'),
            hidden: true
        }
    },
    params: {
        'allowSignUp': true,
        'allowPasswordReset': true,
        'passwordChangeUrl': '/auth/change-password',
        'expiredPasswordMessage': 'You password has expired',
        'userPasswordValidator': {
            min: 6,
            max: 24
        },
        'oldUserPasswords': 0,
        'minUserPasswordLifetime': 'P10D', // ISO_8601#Duration
        'maxUserPasswordLifetime': 'P30D',
        'verificationLifetime': 'P1D',
        'repeatVerificationTimeout': 'P1D',
        'captcha': {
            minLength: 4,
            maxLength: 5
        },
        'static': {},
        'template': {
            engine: require('areto-ejs'),
            extension: 'ejs'
        },
        'serverAddress': 'http://localhost',
        'userUpdateUrl': `/admin/user?modal=${encodeURIComponent('admin/user/update?id=')}`
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
        'notifications': {
            Class: require('../component/widget/Notifications')
        },
        'user': {
            Class: require('../component/widget/UserWidget')
        }
    },
    indexes: [
        'model/User',
        'model/UserLog',
        'security/UserPassword',
        'security/Verification'
    ]
};