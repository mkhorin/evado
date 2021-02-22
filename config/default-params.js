/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

module.exports = {

    'captcha': {
        minLength: 4,
        maxLength: 5
    },
    'changePasswordUrl': '/auth/change-password',
    'enablePasswordChange': true,
    'enablePasswordReset': false,
    'enableSignUp': false,
    'enableSignUpVerification': true,

    'languageCookie': 'language',
    'languageToggle': false,

    'minUserPasswordLifetime': 'P10D', // see ISO_8601#Duration
    'maxUserPasswordLifetime': 'P30D',
    'oldUserPasswords': 0,
    'verificationLifetime': 'P1D',
    'repeatVerificationTimeout': 'P1D',

    'serverAddress': 'http://localhost',
    'static': {},
    'template': {
        engine: require('areto-ejs'),
        extension: 'ejs'
    },
    'userNameValidator': {
        min: 2,
        max: 24
    },
    'userPasswordValidator': {
        min: 6,
        max: 24
    },
    'userUpdateUrl': `/admin/user?frame=${encodeURIComponent('admin/user/update?id=')}`
};