/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

module.exports = {

    'enablePasswordChange': true,
    'enablePasswordReset': false,
    'enableSignUp': false,
    'enableSignUpVerification': true,
    'changePasswordUrl': '/auth/change-password',
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
    'userNameValidator': {
        min: 2,
        max: 24
    },
    'static': {},
    'template': {
        engine: require('areto-ejs'),
        extension: 'ejs'
    },
    'serverAddress': 'http://localhost',
    'userUpdateUrl': `/admin/user?frame=${encodeURIComponent('admin/user/update?id=')}`
};