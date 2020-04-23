/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

module.exports = {

    'allowSignUp': false,
    'allowPasswordReset': false,
    'disableSignUpVerification': false,
    'passwordChangeUrl': '/auth/change-password',
    'userPasswordValidator': {
        min: 6,
        max: 24
    },
    'oldUserPasswords': 0,
    'minUserPasswordLifetime': 'P10D', // see ISO_8601#Duration
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
};