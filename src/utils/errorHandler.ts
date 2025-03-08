import { Request, Response, NextFunction } from "express";
import BaseError from "../errors/base.error.js";
import { ErrorType } from "../types/error.type.js";

export default function errorHandler(
    error: ErrorType,
    request: Request,
    response: Response,
    next: NextFunction
) {
    if (error instanceof BaseError) {
        response.status(error.statusCode).json({
            success: false,
            message: error.message,
            error: error.details,
            data: {},
        });
    } else {
        response.status(500).json({
            success: false,
            message: "Something went wrong!",
            error: error.message || error,
            data: {},
        });
    }
}
