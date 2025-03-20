import BaseError from "./base.error.js";

export default class internalServerError extends BaseError {

    constructor(details: object) {
        super("Internal Server Error", 500, "Something went wrong !!", details);
    }
}