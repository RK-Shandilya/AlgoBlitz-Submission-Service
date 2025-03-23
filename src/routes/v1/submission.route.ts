import { Router } from "express";
import createSubmission, { runCustomTest } from "../../controllers/submission.controller.js";

const SubmissionRouter = Router();

SubmissionRouter.post("/", createSubmission);
SubmissionRouter.post("/run-tests", runCustomTest);
export default SubmissionRouter;