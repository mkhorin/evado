/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

Jam.ModelCondition = class ModelCondition {

    constructor (data, model) {
        this.data = data;
        this.model = model;
        this.attrMap = {};
    }

    isValid () {
        return this.validate(this.data);
    }

    isValueExists (value) {
        return value !== '' && value !== null && value !== undefined;
    }

    getValue (name) {
        if (!this.attrMap.hasOwnProperty(name)) {
            this.attrMap[name] = this.model.getAttr(name);
        }
        if (this.attrMap[name]) {
            return this.attrMap[name].getValue();
        }
    }

    validate (data) {
        if (!Array.isArray(data)) {
            return this.validateHash(data);
        }
        let operator = data[0];
        if (operator && typeof operator === 'object') {
            operator = 'AND';
        } else {
            data = data.slice(1);
        }
        if (Jam.ModelCondition.OPERATORS.hasOwnProperty(operator)) {
            return this[Jam.ModelCondition.OPERATORS[operator]](operator, data);
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
            return this.logDataError(operator, operands);
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
            return this.logDataError(operator, operands);
        }
        for (const operand of operands) {
            if (this.validate(operand)) {
                return true;
            }
        }
        return false;
    }

    validateExists (operator, operands) {
        return operands.length !== 1
            ? this.logDataError(operator, operands)
            : this.isValueExists(this.getValue(operands[0]));
    }

    validateNotExists () {
        return !this.validateExists(...arguments);
    }

    validateBetween (operator, operands) {
        if (operands.length !== 3) {
            return this.logDataError(operator, operands);
        }
        const value = this.getValue(operands[0]);
        return value >= operands[1] && value <= operands[2];
    }

    validateNotBetween () {
        return !this.validateBetween(...arguments);
    }

    validateIn (operator, operands) {
        return operands.length !== 2 || !Array.isArray(operands[1])
            ? this.logDataError(operator, operands)
            : operands[1].includes(this.getValue(operands[0]));
    }

    validateNotIn () {
        return !this.validateIn(...arguments);
    }

    validateRegex (operator, operands) {
        return operands.length < 2
            ? this.logDataError(operator, operands)
            : (new RegExp(operands[1], operands[2])).test(this.getValue(operands[0]));
    }

    validateEqual (operator, operands) {
        return operands.length !== 2
            ? this.logDataError(operator, operands)
            : operands[1] === this.getValue(operands[0]);
    }

    validateNotEqual () {
        return !this.validateEqual(...arguments);
    }

    validateGreater (operator, operands) {
        return operands.length !== 2
            ? this.logDataError(operator, operands)
            : this.getValue(operands[0]) > operands[1];
    }

    validateGreaterOrEqual (operator, operands) {
        return operands.length !== 2
            ? this.logDataError(operator, operands)
            : this.getValue(operands[0]) >= operands[1];
    }

    validateLess (operator, operands) {
        return operands.length !== 2
            ? this.logDataError(operator, operands)
            : this.getValue(operands[0]) < operands[1];
    }

    validateLessOrEqual (operator, operands) {
        return operands.length !== 2
            ? this.logDataError(operator, operands)
            : this.getValue(operands[0]) <= operands[1];
    }

    logDataError (operator, operands) {
        return this.log('error', `${operator}: operands invalid: ${JSON.stringify(operands)}`);
    }

    log (type, message) {
        console[type](message);
    }
};

Jam.ModelCondition.OPERATORS = {
    'AND': 'validateAnd',
    'OR': 'validateOr',
    'EXISTS': 'validateExists',
    'NOT EXISTS': 'validateNotExists',
    'BETWEEN': 'validateBetween',
    'NOT BETWEEN':'validateNotBetween',
    'IN': 'validateIn',
    'NOT IN': 'validateNotIn',
    'REGEX': 'validateRegex',
    '=': 'validateEqual',
    '!=': 'validateNotEqual',
    '>': 'validateGreater',
    '>=': 'validateGreaterOrEqual',
    '<': 'validateLess',
    '<=': 'validateLessOrEqual'
};