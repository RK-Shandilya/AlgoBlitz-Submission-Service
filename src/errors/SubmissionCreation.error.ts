import BaseError from "./base.error.js";

export default class SubmissionCreationError extends BaseError {

    constructor(details: string) {
        super("Not able to create submission", 401, details);
    }
}