import BaseError from "./base.error.js";

export default class NotfoundError extends BaseError {

    constructor(resourceName: string, resourceValue: string) {
        super("Not Found Error" , 404, `The requested resource: ${resourceName} with value ${resourceValue} is not found`, {
            resourceName,
            resourceValue
        });
    }
}