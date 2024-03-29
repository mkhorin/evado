/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
Jam.ModelCondition = class ModelCondition {

    static OPERATORS = {
        'and': 'validateAnd',
        'or': 'validateOr',
        'empty': 'validateEmpty',
        'notEmpty': 'validateNotEmpty',
        'between': 'validateBetween',
        'notBetween': 'validateNotBetween',
        'in': 'validateIn',
        'notIn': 'validateNotIn',
        'regex': 'validateRegex',
        '=': 'validateEqual',
        '!=': 'validateNotEqual',
        '>': 'validateGreater',
        '>=': 'validateGreaterOrEqual',
        '<': 'validateLess',
        '<=': 'validateLessOrEqual',
        'false': 'validateFalse',
        'true': 'validateTrue',
        'initial': 'validateInitial',
        'startTrigger': 'validateStartTrigger',
        'trigger': 'validateTrigger'
    };

    constructor (data, model) {
        this.data = data;
        this.model = model;
        this.attrMap = {};
        this.initial = false;
    }

    isValid () {
        return this.validate(this.data);
    }

    hasValue (name) {
        const attr = this.getAttr(name);
        return attr ? attr.hasValue() : false;
    }

    getValue (name) {
        const attr = this.getAttr(name);
        return attr ? attr.getValue() : undefined;
    }

    getAttr (name) {
        if (!Jam.ObjectHelper.has(name, this.attrMap)) {
            this.attrMap[name] = this.model.getAttr(name);
        }
        if (this.attrMap[name]) {
            return this.attrMap[name];
        }
        this.log('error', `Model attribute not found: ${name}`);
    }

    validate (data) {
        if (!Array.isArray(data)) {
            return this.validateHash(data);
        }
        let operator = data[0];
        if (operator && typeof operator === 'object') {
            operator = 'and';
        } else {
            data = data.slice(1);
        }
        if (this.constructor.OPERATORS.hasOwnProperty(operator)) {
            return this[this.constructor.OPERATORS[operator]](operator, data);
        }
        this.log('error', `Operator not found: ${operator}`);
    }

    validateHash (data) {
        for (const name of Object.keys(data)) {
            const value = this.getValue(name);
            if (Array.isArray(data[name])) {
                if (!data[name].includes(value)) {
                    return false;
                }
            } else if (data[name] !== value) {
                return false;
            }
        }
        return true;
    }

    validateAnd (operator, operands) {
        if (operands.length === 0) {
            return this.logDataError(...arguments);
        }
        for (const operand of operands) {
            if (!this.validate(operand)) {
                return false;
            }
        }
        return true;
    }

    validateOr (operator, operands) {
        if (operands.length === 0) {
            return this.logDataError(...arguments);
        }
        for (const operand of operands) {
            if (this.validate(operand)) {
                return true;
            }
        }
        return false;
    }

    validateEmpty () {
        return !this.validateNotEmpty(...arguments);
    }

    validateNotEmpty (operator, operands) {
        if (operands.length !== 1) {
            return this.logDataError(...arguments);
        }
        return this.hasValue(operands[0]);
    }

    validateBetween (operator, operands) {
        if (operands.length !== 3) {
            return this.logDataError(...arguments);
        }
        const value = this.getValue(operands[0]);
        return value >= operands[1] && value <= operands[2];
    }

    validateNotBetween () {
        return !this.validateBetween(...arguments);
    }

    validateIn (operator, operands) {
        if (operands.length !== 2 || !Array.isArray(operands[1])) {
            return this.logDataError(...arguments);
        }
        const value = this.getValue(operands[0]);
        return operands[1].includes(value);
    }

    validateNotIn () {
        return !this.validateIn(...arguments);
    }

    validateRegex (operator, operands) {
        if (operands.length < 2) {
            return this.logDataError(...arguments);
        }
        const regex = new RegExp(operands[1], operands[2]);
        const value = this.getValue(operands[0]);
        return regex.test(value);
    }

    validateEqual (operator, operands) {
        if (operands.length !== 2) {
            return this.logDataError(...arguments);
        }
        const value = this.getValue(operands[0]);
        return operands[1] === value;
    }

    validateNotEqual () {
        return !this.validateEqual(...arguments);
    }

    validateGreater (operator, operands) {
        if (operands.length !== 2) {
            return this.logDataError(...arguments);
        }
        const value = this.getValue(operands[0]);
        return value > operands[1];
    }

    validateGreaterOrEqual (operator, operands) {
        if (operands.length !== 2) {
            return this.logDataError(...arguments);
        }
        const value = this.getValue(operands[0]);
        return value >= operands[1];
    }

    validateLess (operator, operands) {
        if (operands.length !== 2) {
            return this.logDataError(...arguments);
        }
        const value = this.getValue(operands[0]);
        return value < operands[1];
    }

    validateLessOrEqual (operator, operands) {
        if (operands.length !== 2) {
            return this.logDataError(...arguments);
        }
        const value = this.getValue(operands[0]);
        return value <= operands[1];
    }

    validateTrue () {
        return true;
    }

    validateFalse () {
        return false;
    }

    /**
     * Check that this is the initial value setting
     */
    validateInitial () {
        return this.initial;
    }

    /**
     * Check that the operand is starting trigger of changes
     */
    validateStartTrigger (operator, operands) {
        return this.validateTrigger(operator, operands, 'startTriggerAttr');
    }

    /**
     * Check that the operand is trigger of changes
     */
    validateTrigger (operator, operands, key = 'triggerAttr') {
        if (operands.length !== 1) {
            return this.logDataError(...arguments);
        }
        const tracker = this.model.changeTracker;
        if (tracker) {
            const attr = this.getAttr(operands[0]);
            return tracker[key] === attr;
        }
    }

    logDataError (operator, operands) {
        this.log('error', `${operator}: Operands invalid: ${JSON.stringify(operands)}`);
    }

    log (type, message) {
        console[type](`${this.constructor.name}: ${message}`);
    }
};