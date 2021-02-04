/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('../component/base/BaseController');

module.exports = class AuthController extends Base {

    static getConstants () {
        return {
            ACTIONS: {
                'captcha': require('../component/action/CaptchaAction')
            },
            BEHAVIORS: {
                'access': {
                    Class: require('areto/filter/AccessControl'),
                    rules: [{
                        actions: ['changePassword'],
                        match: action => action.controller.canChangePassword() ? undefined : false
                    },{
                        actions: ['signUp'],
                        match: action => action.controller.canSignUp() ? undefined /* to continue rules */ : false
                    },{
                        actions: ['requestReset', 'resetPassword'],
                        match: action => action.controller.canResetPassword() ? undefined : false
                    },{
                        actions: ['signIn', 'signUp', 'requestReset', 'resetPassword'],
                        permissions: ['?'],
                        deny: action => action.render('signed', {model: action.user.identity})
                    }]
                }
            },
            METHODS: {
                'signOut': 'post'
            }
        };
    }

    async actionSignIn () {
        const model = this.spawn('model/auth/SignInForm');
        await model.resolveRateLimit();
        if (model.isBlocked()) {
            return this.blockByRateLimit(model.rateLimitModel);
        }
        if (this.isGetRequest()) {
            return this.render('signIn', {model});
        }
        model.captchaAction = this.createAction('captcha');
        if (!await model.load(this.getPostParams()).login()) {
            return this.render('signIn', {model});
        }
        if (this.user.getIdentity().isVerified()) {
            return this.goBack(this.getQueryParam('returnUrl'));
        }
        this.setFlash('error', 'auth.userNotVerified');
        return this.redirect('request-verification');
    }

    async actionSignOut () {
        await this.user.logout();
        this.redirect(this.module.getParam('afterSignOutUrl') || this.module.getHomeUrl());
    }

    async actionSignUp () {
        const model = this.spawn('model/auth/SignUpForm');
        if (this.isGetRequest()) {
            return this.render('signUp', {model});
        }
        model.captchaAction = this.createAction('captcha');
        const user = await model.load(this.getPostParams()).register();
        if (!user) {
            return this.render('signUp', {model});
        }
        let verified = user.isVerified();
        let type = verified ? 'success' : 'info';
        let message = verified ? 'auth.registrationCompleted' : 'auth.verificationSent';
        message = this.translate(message, {email: model.get('email')});
        return this.render('alert', {type, message});
    }

    async actionChangePassword () {
        const model = this.spawn('model/auth/ChangePasswordForm');
        if (this.isGetRequest()) {
            return this.render('changePassword', {model});
        }
        this.checkCsrfToken();
        model.captchaAction = this.createAction('captcha');
        if (!await model.load(this.getPostParams()).changePassword()) {
            return this.render('changePassword', {model});
        }
        this.setFlash('success', 'auth.passwordChanged');
        this.reload();
    }

    async actionRequestReset () {
        const model = this.spawn('model/auth/RequestResetForm');
        if (this.isGetRequest()) {
            return this.render('requestReset', {model});
        }
        model.captchaAction = this.createAction('captcha');
        if (!await model.load(this.getPostParams()).request()) {
            return this.render('requestReset', {model});
        }
        this.setFlash('success', 'auth.resetPasswordKeySent', {
            email: model.get('email')
        });
        this.reload();
    }

    async actionResetPassword () {
        const model = this.spawn('model/auth/ResetPasswordForm');
        if (this.isGetRequest()) {
            return this.render('resetPassword', {model});
        }
        await model.load(this.getPostParams());
        model.set('key', this.getQueryParam('key'));
        model.captchaAction = this.createAction('captcha');
        if (!await model.resetPassword()) {
            return this.render('resetPassword', {model});
        }
        this.setFlash('success', 'auth.newPasswordSet');
        this.goLogin();
    }

    async actionRequestVerification () {
        const model = this.spawn('model/auth/RequestVerificationForm');
        if (this.isGetRequest()) {
            return this.render('requestVerification', {model});
        }
        model.captchaAction = this.createAction('captcha');
        if (!await model.load(this.getPostParams()).request()) {
            return this.render('requestVerification', {model});
        }
        this.setFlash('success', 'auth.verificationSent', {
            email: model.get('email')
        });
        this.reload();
    }

    async actionVerify () {
        const model = this.spawn('model/auth/VerifyForm');
        model.set('key', this.getQueryParam('key'));
        if (!await model.verify()) {
            this.setFlash('error', model.getFirstError());
            return this.redirect('request-verification');
        }
        return this.render('alert', {
            type: 'success',
            message: this.translate('auth.userVerified')
        });
    }

    canChangePassword () {
        return this.module.getParam('enablePasswordChange');
    }

    canSignUp () {
        return this.module.getParam('enableSignUp');
    }

    canResetPassword () {
        return this.module.getParam('enablePasswordReset');
    }

    blockByRateLimit (model) {
        return this.isGetRequest()
            ? this.setHttpStatus(403).render('blocked', {model})
            : this.reload();
    }
};
module.exports.init(module);