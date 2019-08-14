/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const CAPTCHA_SCENARIO = 'captcha';
const Base = require('areto/base/Model');

module.exports = class SignInForm extends Base {

    static getConstants () {
        return {
            RULES: [
                [['email', 'password'], 'required'],
                ['email', 'email'],
                ['rememberMe', 'checkbox'],
                ['password', 'string', {min: 6, max:24}],
                ['captchaCode', 'required', {on: [CAPTCHA_SCENARIO]}],
                ['captchaCode', require('areto/security/captcha/CaptchaValidator'), {on: [CAPTCHA_SCENARIO]}]
            ],
            ATTR_LABELS: {
                rememberMe: 'Remember me',
                captchaCode: 'Verification code'
            },
            CAPTCHA_SCENARIO
        };
    }

    constructor (config) {
        super({
            // user: [WebUser]
            rateLimit: config.module.get('rateLimit'),
            rateLimitType: 'signIn',
            rememberPeriod: 7 * 24 * 3600,
            ...config
        });
    }

    isCaptchaRequired () {
        return this.scenario === this.CAPTCHA_SCENARIO;
    }

    isBlocked () {
        return this.rateLimitModel && this.rateLimitModel.isBlocked();
    }

    async resolveRateLimit () {
        if (this.rateLimit instanceof RateLimit) {
            this.rateLimitModel = await this.rateLimit.find(this.rateLimitType, this.user);
            this.toggleCaptchaScenario();
        }
    }

    async login () {
        if (!await this.validate()) {
            return false;
        }
        const auth = this.spawn('security/PasswordAuthService', {user: this.user});
        const error = await auth.login(this.getAttrMap());
        if (error) {
            this.addError('email', error);
        }
        await this.updateRateLimit();
        this.toggleCaptchaScenario();
        return !error;
    }

    toggleCaptchaScenario () {
        this.scenario = this.rateLimitModel && this.rateLimitModel.isLimited()
            ? this.CAPTCHA_SCENARIO : null;
    }

    async updateRateLimit () {
        if (this.rateLimitModel) {
            if (this.hasError()) {
                return this.rateLimitModel.increment();
            }
            if (this.isCaptchaRequired()) { // captcha validated
                return this.rateLimitModel.reset();
            }
        }
    }
};
module.exports.init(module);

const RateLimit = require('areto/security/rate-limit/RateLimit');