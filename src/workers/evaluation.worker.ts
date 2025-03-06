import axios from "axios";
import { Job, Worker } from "bullmq";
import redisConnection from "../config/redis.config.js";

export default async function EvaluationWorker(queueName: string) {
    new Worker(queueName, async (job: Job) => {
        if(job.name === "EvaluationJob") {
            try {
                const response = await axios.post('http://localhost:3001/sendPayload', {
                    userId: job.data.userId,
                    payload: job.data
                });
                console.log(response);
                console.log(job.data);
            } catch(error) {
                console.log("Error sending payload", error);
            }
        }
    },{
        connection: redisConnection
    })
}