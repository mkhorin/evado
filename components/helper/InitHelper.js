'use strict';

module.exports = class InitHelper {

    static async createUsers (items, User) {
        if (items instanceof Array) {
            for (let item of items) {
                await this.createUser(item, User);
            }
        }
    }

    static async createUser (data, User) {
        let model = new User;
        model.scenario = 'create';
        model.setSafeAttrs(data);
        if (!await model.save()) {
            let error = User.module.get('i18n').translateMessageMap(model.getFirstErrors());
            User.module.log('error', `${JSON.stringify(error)}: ${JSON.stringify(data)}`);
        }
    }
};