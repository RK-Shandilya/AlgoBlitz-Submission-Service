import { Router } from "express";
import createSubmission from "../../controllers/submission.controller.js";

const SubmissionRouter = Router();

SubmissionRouter.post("/", createSubmission);

export default SubmissionRouter;