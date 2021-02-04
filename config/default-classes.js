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
    'model/UserFilter': require('../model/UserFilter'),
    'model/UserLog': require('../model/UserLog'),

    'notifier/MessageTemplate': require('../component/notifier/MessageTemplate'),
    'notifier/Notification': require('../component/notifier/Notification'),
    'notifier/NotificationMessage': require('../component/notifier/NotificationMessage'),
    'notifier/PopupNotification': require('../component/notifier/PopupNotification'),

    'observer/EventHandler': require('../component/observer/EventHandler'),
    'observer/Listener': require('../component/observer/Listener'),
    'observer/NotificationHandler': require('../component/observer/NotificationHandler'),
    'observer/TaskHandler': require('../component/observer/TaskHandler'),

    'security/PasswordAuthService': require('../component/security/PasswordAuthService'),
    'security/UserPassword': require('../component/security/UserPassword'),
    'security/Verification': require('../component/security/Verification'),
    'security/WebUser': require('../component/security/WebUser'),

    'validator/PasswordValidator': require('../component/validator/PasswordValidator'),
    'validator/UserNameValidator': require('../component/validator/UserNameValidator')
};