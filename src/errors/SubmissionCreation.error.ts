import BaseError from "./base.error.js";

export default class SubmissionCreationError extends BaseError {

    constructor(details: object) {
        super("Submission Creation Erorr", 401,"Not able to create submission",details);
    }
}