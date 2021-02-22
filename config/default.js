/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

module.exports = {

    commonMenuTitle: 'Home',

    components: {
        'logger': {
            level: 'info'
        },
        'actionProfiler': {
            Class: require('areto/log/ActionProfiler')
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
            secret: 'evado-app'
        },
        'i18n': {
            sources: {
                'app': {
                    forceTranslation: true
                },
                'mail': {
                    forceTranslation: true
                },
                'notification': {
                    forceTranslation: true
                }
            }
        },
        'formatter': {
            Class: require('../component/other/Formatter')
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
            errors: {
                Controller: require('../controller/DefaultController')
            }
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
            rbacTablePrefix: 'sys_rbac_'
        },
        'notifier': {
            Class: require('../component/notifier/Notifier'),
            tasks: ['sendNotifications']
        },
        'observer': {
            Class: require('../component/observer/Observer'),
        },
        'mailer': {
            Class: require('../component/mailer/DummyMailer')
        },
        'utility': {
            Class: require('../component/utility/UtilityManager')
        },
        'fileStorage': require('./default-fileStorage')
    },
    modules: {
        'api': {
            Class: require('evado/module/api/Module'),
            hidden: true
        }
    },
    assets: require('./default-assets'),
    classes: require('./default-classes'),
    params: require('./default-params'),
    utilities: require('./default-utilities'),
    widgets: require('./default-widgets'),
    indexes: [
        'model/RawFile',
        'model/User',
        'model/UserLog',
        'security/UserPassword',
        'security/Verification'
    ]
};