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
                ['password', 'validator/PasswordValidator'],
                ['captchaCode', 'required', {on: CAPTCHA_SCENARIO}],
                ['captchaCode', require('areto/security/captcha/CaptchaValidator'), {on: CAPTCHA_SCENARIO}]
            ],
            ATTR_LABELS: {
                rememberMe: 'Remember me',
                captchaCode: 'Verification code'
            },
            CAPTCHA_SCENARIO
        };
    }

    /**
     * @param {Object} config
     * @param {Object} config.user - WebUser instance
     */
    constructor (config) {
        super({
            rateLimit: config.module.get('rateLimit'),
            rateLimitType: 'signIn',
            rememberPeriod: 7 * 24 * 3600,
            captchaEnabled: true,
            ...config
        });
    }

    isCaptchaRequired () {
        return this.scenario === this.CAPTCHA_SCENARIO;
    }

    isBlocked () {
        return this.rateLimitModel?.isBlocked();
    }

    async resolveRateLimit () {
        if (this.rateLimit instanceof RateLimit) {
            this.rateLimitModel = await this.rateLimit.find(this.rateLimitType, this.user);
            this.setCaptchaScenario();
        }
    }

    async login () {
        if (!await this.validate()) {
            return false;
        }
        try {
            const service = this.spawn('security/PasswordAuthService');
            const identity = await service.login(this.get('email'), this.get('password'), this.user);
            const duration = this.get('rememberMe') ? this.rememberPeriod : 0;
            await this.user.login({identity, duration});
        } catch (err) {
            this.addError('email', err);
        }
        await this.updateRateLimit();
        this.setCaptchaScenario();
        return !this.hasError();
    }

    setCaptchaScenario () {
        this.scenario = this.rateLimitModel?.isExceeded()
            ? this.CAPTCHA_SCENARIO
            : null;
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

const RateLimit = require('areto/security/rateLimit/RateLimit');