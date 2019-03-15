'use strict';

const CAPTCHA_SCENARIO = 'captcha';
const Base = require('areto/base/Model');

module.exports = class SignInForm extends Base {

    static getConstants () {
        return {
            RULES: [
                [['email', 'password'], 'required'],
                ['email', 'email'],
                ['rememberMe', 'filter', {filter: 'boolean'}],
                ['password', 'string', {min: 6, max:24}],
                ['captchaCode', 'required', {on: [CAPTCHA_SCENARIO]}],
                ['captchaCode', require('areto/captcha/CaptchaValidator'), {on: [CAPTCHA_SCENARIO]}]
            ],
            ATTR_LABELS: {
                'rememberMe': 'Remember me',
                'captchaCode': 'Verification code'
            },
            CAPTCHA_SCENARIO
        };
    }

    constructor (config) {
        super({
            // user: new WebUser
            'rateLimit': SignInForm.module.get('rateLimit'),
            'rateLimitType': 'signIn',
            'rememberPeriod': 7 * 24 * 3600,
            ...config
        });
    }

    isCaptchaRequired () {
        return this.scenario === this.CAPTCHA_SCENARIO;
    }

    isBlocked () {
        return this.rateLimitModel && this.rateLimitModel.isBlocked();
    }

    toggleCaptchaScenario () {
        this.scenario = this.rateLimitModel && this.rateLimitModel.isLimited()
            ? this.CAPTCHA_SCENARIO : null;
    }

    async resolveRateLimit () {
        if (this.rateLimit instanceof RateLimit) {
            this.rateLimitModel = await this.rateLimit.find(this.rateLimitType, this.user);
            this.toggleCaptchaScenario();
        }
    }

    async login (complete) {
        if (!await this.validate()) {
            return false;
        }
        let result = await this.createLoginByEmail().login();
        if (result.error) {
            this.addError('email', result.error);
        }
        await this.updateRateLimit();
        this.toggleCaptchaScenario();
        return !result.error;
    }

    createLoginByEmail () {
        return new LoginByEmail({
            'email': this.get('email'),
            'password': this.get('password'),
            'rememberMe': this.get('rememberMe'),
            'user': this.user
        });
    }

    async updateRateLimit () {
        if (this.rateLimitModel) {
            if (this.hasError()) {
                return this.rateLimitModel.increment();
            }
            if (this.isCaptchaRequired()) { // captcha has been validated
                return this.rateLimitModel.reset();
            }
        }
    }
};
module.exports.init(module);

const RateLimit = require('areto/web/rate-limit/RateLimit');
const LoginByEmail = require('../../component/helper/LoginByEmail');