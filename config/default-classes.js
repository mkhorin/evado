/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

module.exports = {

    'model/auth/ChangePasswordForm': require('../model/auth/ChangePasswordForm'),
    'model/auth/ResetPasswordForm': require('../model/auth/ResetPasswordForm'),
    'model/auth/RequestResetForm': require('../model/auth/RequestResetForm'),
    'model/auth/RequestVerificationForm': require('../model/auth/RequestVerificationForm'),
    'model/auth/SignInForm': require('../model/auth/SignInForm'),
    'model/auth/SignUpForm': require('../model/auth/SignUpForm'),
    'model/auth/VerifyForm': require('../model/auth/VerifyForm'),

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
    'notifier/Recipient': require('../component/notifier/Recipient'),
    'notifier/UserFilter': require('../component/notifier/UserFilter'),

    'observer/EventHandler': require('../component/observer/EventHandler'),
    'observer/Listener': require('../component/observer/Listener'),
    'observer/NoticeHandler': require('../component/observer/NoticeHandler'),
    'observer/TaskHandler': require('../component/observer/TaskHandler'),

    'security/PasswordAuthService': require('../component/security/PasswordAuthService'),
    'security/PasswordValidator': require('../component/security/PasswordValidator'),
    'security/UserPassword': require('../component/security/UserPassword'),
    'security/Verification': require('../component/security/Verification'),
};