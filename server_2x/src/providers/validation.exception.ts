import {HttpException, HttpStatus, ValidationError} from "@nestjs/common";

export class ValidationException extends HttpException {
    constructor(validationErrors?: ValidationError[], operand: any = null) {
        const mappedErrors = validationErrors?.map(e => {
            return {
                constraints: e.constraints,
                field: e.property,
                value: e.value
            }
        });
        super({
            message: 'Validation failed',
            operand,
            errors: mappedErrors || 'No details provided.'
        }, HttpStatus.BAD_REQUEST);
    }
}