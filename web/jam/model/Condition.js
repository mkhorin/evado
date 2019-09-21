/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

Jam.ModelCondition = class {

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
        return this.attrMap[name] && this.attrMap[name].getValue();
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
        return Jam.ModelCondition.OPERATORS.hasOwnProperty(operator)
            ? this[Jam.ModelCondition.OPERATORS[operator]](operator, data)
            : this.log('error', `Operator not found: ${operator}`);
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

    validateNotExists (operator, operands) {
        return !this.validateExists(operator, operands);
    }

    validateBetween (operator, operands) {
        if (operands.length !== 3) {
            return this.logDataError(operator, operands);
        }
        const value = this.getValue(operands[0]);
        return value >= operands[1] && value <= operands[2];
    }

    validateNotBetween (operator, operands) {
        return !this.validateBetween(operator, operands);
    }

    validateIn (operator, operands) {
        return operands.length !== 2 || !Array.isArray(operands[1])
            ? this.logDataError(operator, operands)
            : operands[1].includes(this.getValue(operands[0]));
    }

    validateNotIn (operator, operands) {
        return !this.validateIn(operator, operands);
    }

    validateRegExp (operator, operands) {
        return operands.length < 2
            ? this.logDataError(operator, operands)
            : (new RegExp(operands[1], operands[2])).test(this.getValue(operands[0]));
    }

    validateEqual (operator, operands) {
        return operands.length !== 2
            ? this.logDataError(operator, operands)
            : operands[1] === this.getValue(operands[0]);
    }

    validateNotEqual (operator, operands) {
        return !this.validateEqual(operator, operands);
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
        console[type](this.wrapClassMessage(message));
        return false;
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
    'REGEXP': 'validateRegExp',
    '=': 'validateEqual',
    '!=': 'validateNotEqual',
    '>': 'validateGreater',
    '>=': 'validateGreaterOrEqual',
    '<': 'validateLess',
    '<=': 'validateLessOrEqual'
};