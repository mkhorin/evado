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
                    Class: require('areto/captcha/CaptchaAction'),
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
                        roles: ['@']
                    },{
                        actions: ['sign-up'],
                        match: action => action.controller.canSignUp() ? undefined /* to continue rules */ : false
                    },{
                        actions: ['sign-in', 'sign-up'],
                        roles: ['?'],
                        deny: action => action.render('signed', {model: action.controller.user.model})
                    }]
                }
            },
            METHODS: {
                'sign-out': 'post'
            }
        };
    }

    async actionSignOut () {
        await this.user.logout();
        this.goLogin();
    }

    async actionSignIn () {
        let model = this.spawn(SignInForm, {user: this.user});
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

    async actionSignUp () {
        let model = this.spawn(SignUpForm, {user: this.user});
        if (this.isGet()) {
            return this.render('sign-up', {model});
        }
        model.captchaAction = this.createAction('captcha');
        return await model.load(this.getPostParams()).register()
            ? this.goLogin()
            : this.render('sign-up', {model});
    }

    async actionChangePassword () {
        let model = this.spawn(ChangePasswordForm, {userModel: this.user.model});
        if (this.isGet()) {
            return this.render('change-password', {model});
        }
        model.captchaAction = this.createAction('captcha');
        if (!await model.changePassword()) {
            return this.render('change-password', {model});
        }
        this.setFlash('passwordChanged', this.translate('Your password has been changed'));
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

const SignInForm = require('../model/auth/SignInForm');
const SignUpForm = require('../model/auth/SignUpForm');
const ChangePasswordForm = require('../model/auth/ChangePasswordForm');