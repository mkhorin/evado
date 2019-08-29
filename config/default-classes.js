/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

module.exports = {

    'model/auth/ChangePasswordForm': require('../model/auth/ChangePasswordForm'),
    'model/auth/SignInForm': require('../model/auth/SignInForm'),
    'model/auth/SignUpForm': require('../model/auth/SignUpForm'),

    'model/File': require('../model/File'),
    'model/RateLimit': require('../model/RateLimit'),
    'model/RawFile': require('../model/RawFile'),
    'model/Task': require('../model/Task'),
    'model/User': require('../model/User'),
    'model/UserLog': require('../model/UserLog'),

    'notifier/MessageTemplate': require('../component/notifier/MessageTemplate'),
    'notifier/Notice': require('../component/notifier/Notice'),

//    'notifier/NoticeJob': require('../component/notifier/NoticeJob'),

    'notifier/NoticeMessage': require('../component/notifier/NoticeMessage'),
    'notifier/NoticeMessageUser': require('../component/notifier/NoticeMessageUser'),
    'notifier/UserFilter': require('../component/notifier/UserFilter'),

    'observer/EventHandler': require('../component/observer/EventHandler'),
    'observer/Listener': require('../component/observer/Listener'),
    'observer/NoticeHandler': require('../component/observer/NoticeHandler'),
    'observer/TaskHandler': require('../component/observer/TaskHandler'),

    'security/PasswordAuthService': require('../component/security/PasswordAuthService'),
    'security/RateLimit': require('areto/security/rate-limit/RateLimit')
};