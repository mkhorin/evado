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
                        actions: ['change-password'],
                        permissions: ['@']
                    },{
                        actions: ['sign-up'],
                        match: action => action.controller.canSignUp() ? undefined /* to continue rules */ : false
                    },{
                        actions: ['request-reset', 'reset-password'],
                        match: action => action.controller.canResetPassword() ? undefined : false
                    },{
                        actions: ['sign-in', 'sign-up', 'request-reset', 'reset-password'],
                        permissions: ['?'],
                        deny: action => action.render('signed', {model: action.user.identity})
                    }]
                }
            },
            METHODS: {
                'sign-out': 'post'
            }
        };
    }

    async actionSignIn () {
        const model = this.spawn('model/auth/SignInForm');
        await model.resolveRateLimit();
        if (model.isBlocked()) {
            return this.blockByRateLimit(model.rateLimitModel);
        }
        if (this.isGet()) {
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
        this.goLogin();
    }

    async actionSignUp () {
        const model = this.spawn('model/auth/SignUpForm');
        if (this.isGet()) {
            return this.render('signUp', {model});
        }
        model.captchaAction = this.createAction('captcha');
        const user = await model.load(this.getPostParams()).register();
        if (!user) {
            return this.render('signUp', {model});
        }
        const message = user.isVerified() ? 'auth.registrationCompleted' : 'auth.verificationSent';
        return this.render('alert', {
            type: 'info',
            message: this.translate(message, {email: model.get('email')})
        });
    }

    async actionChangePassword () {
        const model = this.spawn('model/auth/ChangePasswordForm');
        if (this.isGet()) {
            return this.render('changePassword', {model});
        }
        model.captchaAction = this.createAction('captcha');
        if (!await model.load(this.getPostParams()).changePassword()) {
            return this.render('changePassword', {model});
        }
        this.setFlash('success', 'auth.passwordChanged');
        this.reload();
    }

    async actionRequestReset () {
        const model = this.spawn('model/auth/RequestResetForm');
        if (this.isGet()) {
            return this.render('requestReset', {model});
        }
        model.captchaAction = this.createAction('captcha');
        if (!await model.load(this.getPostParams()).request()) {
            return this.render('requestReset', {model});
        }
        this.setFlash('success', 'auth.resetKeySent', {email: model.get('email')});
        this.reload();
    }

    async actionResetPassword () {
        const model = this.spawn('model/auth/ResetPasswordForm');
        if (this.isGet()) {
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
        if (this.isGet()) {
            return this.render('requestVerification', {model});
        }
        model.captchaAction = this.createAction('captcha');
        if (!await model.load(this.getPostParams()).request()) {
            return this.render('requestVerification', {model});
        }
        this.setFlash('success', 'auth.verificationSent', {email: model.get('email')});
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

    canSignUp () {
        return this.module.getParam('allowSignUp');
    }

    canResetPassword () {
        return this.module.getParam('allowPasswordReset');
    }

    blockByRateLimit (model) {
        return this.isGet()
            ? this.setHttpStatus(403).render('blocked', {model})
            : this.reload();
    }
};
module.exports.init(module);