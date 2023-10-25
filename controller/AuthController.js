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
                        match: ({controller}) => controller.canChangePassword() ? undefined : false
                    },{
                        actions: ['signUp'],
                        match: ({controller}) => controller.canSignUp() ? undefined /*to continue rules*/ : false
                    },{
                        actions: ['requestReset', 'resetPassword'],
                        match: ({controller}) => controller.canResetPassword() ? undefined : false
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
        const params = this.getPostParams();
        if (!await model.load(params).login()) {
            return this.render('signIn', {model});
        }
        if (this.user.getIdentity().isVerified()) {
            const {returnUrl} = this.getQueryParams();
            return this.goBack(returnUrl);
        }
        this.setFlash('error', 'auth.userNotVerified');
        this.redirect('request-verification');
    }

    async actionSignOut () {
        await this.user.logout();
        const {afterSignOutUrl} = this.module.params;
        this.redirect(afterSignOutUrl || this.module.getHomeUrl());
    }

    async actionSignUp () {
        const model = this.spawn('model/auth/SignUpForm');
        if (this.isGetRequest()) {
            return this.render('signUp', {model});
        }
        model.captchaAction = this.createAction('captcha');
        const params = this.getPostParams();
        const user = await model.load(params).register();
        if (!user) {
            return this.render('signUp', {model});
        }
        const verified = user.isVerified();
        const {afterSignUpUrl, autoLoginAfterRegistration} = this.module.params;
        if (autoLoginAfterRegistration) {
            await this.user.login({identity: user});
            return this.redirect(afterSignUpUrl || this.module.getHomeUrl());
        }
        const type = verified ? 'success' : 'info';
        const email = model.get('email');
        const messageCode = verified
            ? 'auth.registrationCompleted'
            : 'auth.verificationSent';
        const message = this.translate(messageCode, {email});
        return this.render('alert', {type, message});
    }

    async actionChangePassword () {
        const model = this.spawn('model/auth/ChangePasswordForm');
        if (this.isGetRequest()) {
            return this.render('changePassword', {model});
        }
        this.checkCsrfToken();
        model.captchaAction = this.createAction('captcha');
        const params = this.getPostParams();
        if (!await model.load(params).changePassword()) {
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
        const params = this.getPostParams();
        if (!await model.load(params).request()) {
            return this.render('requestReset', {model});
        }
        const email = model.get('email');
        this.setFlash('success', 'auth.resetPasswordKeySent', {email});
        this.reload();
    }

    async actionResetPassword () {
        const model = this.spawn('model/auth/ResetPasswordForm');
        if (this.isGetRequest()) {
            return this.render('resetPassword', {model});
        }
        const params = this.getPostParams();
        await model.load(params);
        const {key} = this.getQueryParams();
        model.set('key', key);
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
        const params = this.getPostParams();
        if (!await model.load(params).request()) {
            return this.render('requestVerification', {model});
        }
        const email = model.get('email');
        this.setFlash('success', 'auth.verificationSent', {email});
        this.reload();
    }

    async actionVerify () {
        const model = this.spawn('model/auth/VerifyForm');
        const {key} = this.getQueryParams();
        model.set('key', key);
        if (!await model.verify()) {
            const message = model.getFirstError();
            this.setFlash('error', message);
            return this.redirect('request-verification');
        }
        const type = 'success';
        const message = this.translate('auth.userVerified');
        return this.render('alert', {type, message});
    }

    canChangePassword () {
        return this.module.params.enablePasswordChange;
    }

    canSignUp () {
        return this.module.params.enableSignUp;
    }

    canResetPassword () {
        return this.module.params.enablePasswordReset;
    }

    blockByRateLimit (model) {
        return this.isGetRequest()
            ? this.setHttpStatus(403).render('blocked', {model})
            : this.reload();
    }
};
module.exports.init(module);