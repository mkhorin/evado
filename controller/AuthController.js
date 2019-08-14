/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('../component/base/BaseController');

module.exports = class AuthController extends Base {

    static getConstants () {
        return {
            ACTIONS: {
                'captcha': {
                    Class: require('areto/security/captcha/CaptchaAction'),
                    minLength: 3,
                    maxLength: 4,
                    fixedVerifyCode: '123'
                }
            },
            BEHAVIORS: {
                'access': {
                    Class: require('areto/filter/AccessControl'),
                    rules: [{
                        actions: ['change-password'],
                        permissions: ['@']
                    },{
                        actions: ['sign-up'],
                        match: action => action.controller.canSignUp() ? undefined /* to continue rules */ : false
                    },{
                        actions: ['sign-in', 'sign-up'],
                        permissions: ['?'],
                        deny: action => action.render('signed', {model: action.controller.user.identity})
                    }]
                }
            },
            METHODS: {
                'sign-out': 'post'
            }
        };
    }

    async actionSignIn () {
        const model = this.spawn('model/auth/SignInForm', {user: this.user});
        await model.resolveRateLimit();
        if (model.isBlocked()) {
            return this.blockByRateLimit(model.rateLimitModel);
        }
        if (this.isGet()) {
            return this.render('sign-in', {model});
        }
        model.captchaAction = this.createAction('captcha');
        await model.load(this.getPostParams()).login()
            ? this.goBack()
            : this.render('sign-in', {model});
    }

    async actionSignOut () {
        await this.user.logout();
        this.goLogin();
    }

    async actionSignUp () {
        const model = this.spawn('model/auth/SignUpForm', {user: this.user});
        if (this.isGet()) {
            return this.render('sign-up', {model});
        }
        model.captchaAction = this.createAction('captcha');
        if (!await model.load(this.getPostParams()).register()) {
            return this.render('sign-up', {model});
        }
        this.setFlash('registered', this.translate('Registration completed'));
        this.goLogin();
    }

    async actionChangePassword () {
        const model = this.spawn('model/auth/ChangePasswordForm', {user: this.user});
        if (this.isGet()) {
            return this.render('change-password', {model});
        }
        model.captchaAction = this.createAction('captcha');
        if (!await model.load(this.getPostParams()).changePassword()) {
            return this.render('change-password', {model});
        }
        this.setFlash('passwordChanged', this.translate('Password changed'));
        this.reload();
    }

    canSignUp () {
        return this.module.getParam('allowSignUp');
    }

    blockByRateLimit (model) {
        return this.isGet()
            ? this.setHttpStatus(403).render('blocked', {model})
            : this.reload();
    }
};
module.exports.init(module);