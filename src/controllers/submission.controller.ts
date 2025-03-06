import { Request, Response } from "express";
import {SubmissionService} from "../services/submission.service.js";
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