import { AddSubmission } from '../dtos/addSubmission.dto.js';
import NotfoundError from '../errors/notFound.dto.js';
import Submission from '../models/submission.model.js';

class SubmissionRepository {
    private submissionModel;
    
    constructor() {
        this.submissionModel = Submission;
    }

    async createSubmission(submissionData: AddSubmission) {
        const response = await this.submissionModel.create(submissionData);
        return response;
    }

    async getSubmission(id: string) {
        try {
            const response = await this.submissionModel.findById(id);
            if(!response) {
                throw new NotfoundError('Submission Id', id);
            }
            return response;
        } catch (error) {
            throw error;
        }
    }

    async updateSubmission(id: string, status: string) {
        await this.submissionModel.findByIdAndUpdate(id, { status });
    }
}

export default SubmissionRepository;