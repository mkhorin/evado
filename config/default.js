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
        'console': {
            Class: require('../component/console/Console')
        },
        'view': {
            //theme: 'test'
        },
        'connection': {
            schema: 'mongodb',
            settings: {
                host: 'localhost',
                port: 27017,
                user: '',
                password: '',
                options: {
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
            Class: require('../component/Formatter')
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
            errors: {
                'Controller': require('../controller/DefaultController')
            }
        },
        'asset': {
            bundles: [{
                name: 'jquery',
                js: ['js/jquery.js'],
                css: ['css/jquery.css']
            }, {
                name: 'A1',
                depends: ['C1']
            }, {
                name: 'B1',
                depends: ['A1']
            }, {
                name: 'C1',
                depends: ['jquery']
            }]
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
                'httpOnly': true,
                'path': '/'
            }
        },
        'meta': {
            Class: require('../component/meta/Meta'),
            FileModel: require('../model/File'),
            UserModel: require('../model/User'),
            DataHistoryModel: require('../model/DataHistory'),
            rbacTablePrefix: 'sys_rbac_',
            inspectionEnabled: true
        },
        'metaDeployer': {
            Class: require('../component/meta/deploy/Deployer')
        },
        'metaView': {
            Class: require('../component/meta/view/MetaView'),
            // disabled: true // disable all project views
        }
    },
    modules: {
    },
    params: {
        'template': {
            engine: require('areto-ejs'),
            extension: 'ejs'
        },
        'static': {},
        // 'ignoreProjectConfiguration': true,
        // 'activeProjects': ['test']
    },
    metaModels: {
        'doc': {
            Class: require('areto-meta-doc/base/DocMeta')
        },
        'nav': {
            Class: require('areto-meta-nav/base/NavMeta')
        }
    },
    upload: {
        storeDir: 'upload/file',
        thumbDir: 'upload/preview',
        thumbSizes: {
            1: [56, 56],
            2: [256, 256],
            3: [1024, 1024]
        },
        thumbDefaultSize: 1,
        //maxTotalFiles: 100,
        //maxTotalSize: 100,
        rule: {
            maxSize: 10000000
        }
    },
    assets: {
        source: 'asset/vendor/node_modules',
        target: 'web/vendor',
        defaults: {'base': ['dist', 'min', 'build']},
        defaultBase: 'base',
        files: {
            '@fortawesome': [
                'fontawesome-free/css',
                'fontawesome-free/webfonts'
            ],
            'admin-lte': [
                'dist/css',
                'dist/js/adminlte.min.js'
            ],
            'async': true,
            'bootstrap': true,
            'bootstrap-daterangepicker': [
                'daterangepicker.css',
                'daterangepicker.js'
            ],
            'eonasdan-bootstrap-datetimepicker': true,
            'jquery': true,
            'inputmask': ['dist/min/jquery.inputmask.bundle.min.js'],
            // 'ionicons-min': ['css','fonts'],
            'moment': ['locale','min'],
            'select2': true,
            'store-js': [
                'dist/store.modern.min.js'
            ]
        }
    },
    widgets: {
        'globalMenu': {
            Class: require('../component/widget/GlobalMenu')            
        }
    }
};