import Submission from "../models/submission.model.js";
import SubmissionPayloadType from "../types/submissionPayload.types.js";

export default class SubmissionRepository {
    private submssionModal: typeof Submission;
    constructor() {
        this.submssionModal = Submission;
    }

    async createSubmission(submissionPayload: SubmissionPayloadType) {
        const responce = await this.submssionModal.create(submissionPayload);
        return responce;
    }
}