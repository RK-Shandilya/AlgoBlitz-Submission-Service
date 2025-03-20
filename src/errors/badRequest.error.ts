import BaseError from "./base.error.js";

export default class BadrequestError extends BaseError {
    constructor(propertyName: string, details: object) {
        super('Bad Request', 400, `Invalid structure for ${propertyName} is provided`, details);
    }
}