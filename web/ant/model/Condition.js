'use strict';

Ant.ModelCondition = class {

    constructor (data, model) {
        this.data = data;
        this.model = model;
        this.fieldCache = {};
    }

    logError (msg) {
        console.error(this.wrapClassMessage(msg));
        return false;
    }

    logOperatorError (op, operands) {
        return this.logError(`${op}: operands invalid: ${JSON.stringify(operands)}`);
    }

    getValue (name) {
        if (!Object.prototype.hasOwnProperty.call(this.fieldCache, name)) {
            this.fieldCache[name] = this.model.getValueFieldByName(name);
        }
        return this.fieldCache[name].val();
    }

    isValid () {
        return this.validate(this.data);
    }

    isValueExists (value) {
        return value !== '' && value !== null && value !== undefined;
    }

    validate (data) {
        if (!(data instanceof Array)) {
            return this.validateHash(data);
        }
        let op = data[0];
        if (op && typeof op === 'object') {
            op = 'AND';
        } else {
            data = data.slice(1)
        }
        return Ant.ModelCondition.OPERATORS.hasOwnProperty(op)
            ? this[Ant.ModelCondition.OPERATORS[op]](op, data)
            : this.logError(`Not found operator "${op}"`);
    }

    validateHash (data) {
        for (let name of Object.keys(data)) {
            let value = this.getValue(name);
            if (data[name] instanceof Array) {
                if (!data[name].includes(value)) {
                    return false;
                }
            } else if (data[name] !== value) {
                return false;
            }
        }
        return true;
    }

    validateAnd (op, operands) {
        if (operands.length === 0) {
            return this.logOperatorError(op, operands);
        }
        for (let operand of operands) {
            if (!this.validate(operand)) {
                return false;
            }
        }
        return true;
    }

    validateOr (op, operands) {
        if (operands.length === 0) {
            return this.logOperatorError(op, operands);
        }
        for (let operand of operands) {
            if (this.validate(operand)) {
                return true;
            }
        }
        return false;
    }

    validateExists (op, operands) {
        return operands.length !== 1
            ? this.logOperatorError(op, operands)
            : this.isValueExists(this.getValue(operands[0]));
    }

    validateNotExists (op, operands) {
        return !this.validateExists(op, operands);
    }

    validateBetween (op, operands) {
        if (operands.length !== 3) {
            return this.logOperatorError(op, operands);
        }
        let value = this.getValue(operands[0]);
        return value >= operands[1] && value <= operands[2];
    }

    validateNotBetween (op, operands) {
        return !this.validateBetween(op, operands);
    }

    validateIn (op, operands) {
        return operands.length !== 2 || !Array.isArray(operands[1])
            ? this.logOperatorError(op, operands)
            : operands[1].includes(this.getValue(operands[0]));
    }

    validateNotIn (op, operands) {
        return !this.validateIn(op, operands);
    }

    validateRegExp (op, operands) {
        return operands.length < 2
            ? this.logOperatorError(op, operands)
            : (new RegExp(operands[1], operands[2])).test(this.getValue(operands[0]));
    }

    validateEqual (op, operands) {
        return operands.length !== 2
            ? this.logOperatorError(op, operands)
            : operands[1] === this.getValue(operands[0]);
    }

    validateNotEqual (op, operands) {
        return !this.validateEqual(op, operands);
    }

    validateGreater (op, operands) {
        return operands.length !== 2
            ? this.logOperatorError(op, operands)
            : this.getValue(operands[0]) > operands[1];
    }

    validateGreaterOrEqual (op, operands) {
        return operands.length !== 2
            ? this.logOperatorError(op, operands)
            : this.getValue(operands[0]) >= operands[1];
    }

    validateLess (op, operands) {
        return operands.length !== 2
            ? this.logOperatorError(op, operands)
            : this.getValue(operands[0]) < operands[1];
    }

    validateLessOrEqual (op, operands) {
        return operands.length !== 2
            ? this.logOperatorError(op, operands)
            : this.getValue(operands[0]) <= operands[1];
    }
};

Ant.ModelCondition.OPERATORS = {
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