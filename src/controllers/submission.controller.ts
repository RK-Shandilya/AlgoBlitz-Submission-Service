import { Request, Response } from "express";
import SubmissionService from "../services/submission.service.js";
import SubmissionRepository from "../repositories/submission.repository.js";

const submissionRepository = new SubmissionRepository();
const submissionService = new SubmissionService(submissionRepository);

export default async function createSubmission(req: Request, res: Response): Promise<void> {
    const response = await submissionService.addSubmission(req.body);
    res.status(201).json({
        error: {},
        data: response,
        success: true,
        message: "Submission created successfully"
    });
    return;
}

// Add to submission.controller.ts
export async function runCustomTest(req: Request, res: Response) {
    try {
        console.log("inside controller");
        const { problemId, language, code, customInput } = req.body;
        const userId = "123"; // Assuming user auth is implemented
        
        if (!customInput) {
            res.status(400).json({
                success: false,
                message: "Custom input is required"
            });
            return;
        }
        
        const result = await submissionService.runTest(
            { userId, problemId, language, code },
            customInput
        );
        
        res.status(200).json({
            success: true,
            message: "Custom tests initiated",
            data: result
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error
        });
    }
}