/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

module.exports = {

    'model/auth/ChangePasswordForm': require('../model/auth/ChangePasswordForm'),
    'model/auth/SignInForm': require('../model/auth/SignInForm'),
    'model/auth/SignUpForm': require('../model/auth/SignUpForm'),

    'model/RateLimit': require('../model/RateLimit'),
    'model/RawFile': require('../model/RawFile'),
    'model/User': require('../model/User'),
    'model/UserLog': require('../model/UserLog'),

    'security/PasswordAuthService': require('../component/security/PasswordAuthService'),
    'security/RateLimit': require('areto/security/rate-limit/RateLimit')
};