import { Router } from "express";
import SubmissionRouter from "./submission.route.js";

const v1Router = Router();

v1Router.use("/submissions", SubmissionRouter)

export default v1Router;