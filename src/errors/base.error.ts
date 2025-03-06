export default class BaseError extends Error {
    name: string;
    statusCode: number;
    details: string;
    constructor(name:string, statusCode: number, details: string, description?: string) {
        super(description);
        this.name = name;
        this.statusCode = statusCode;
        this.details = details;
    }
}