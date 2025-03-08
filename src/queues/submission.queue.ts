import { Queue } from "bullmq";
import redisConnection from "../config/redis.config.js";

export const submissionQueue = new Queue("SubmissionQueue", {
    connection: redisConnection
})