import { submissionQueue } from "../queues/submission.queue.js";

export default async function SubmissionProducer(payload: Record<string, unknown>){
    try{
        await submissionQueue.add("SubmissionJob", payload);
    } catch (error) {
        console.log("Error adding job to queue", error);
    }
}