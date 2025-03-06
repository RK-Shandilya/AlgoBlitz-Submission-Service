import { Request, Response } from "express";
import BaseError from "../errors/base.error.js";
import { ErrorType } from "../types/error.type.js";

export default function errorHandler(error: ErrorType, request: Request,response: Response) {
    if (error instanceof BaseError) {
        response.status(error.statusCode).send({
            success: false,
            message: error.message,
            error: error.details,
            data: {}
        });
    } else {
        response.status(500).send({
            success: false,
            message: "something went wrong!",
            error: error.message || error,
            data: {}
        });
    }
}