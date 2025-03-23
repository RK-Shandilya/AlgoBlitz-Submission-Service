import NotfoundError from '../errors/notFound.dto.js';
import Submission from '../models/submission.model.js';
import SubmissionPayloadType from '../types/submissionPayload.types.js';

class SubmissionRepository {
    private submissionModel;
    
    constructor() {
        this.submissionModel = Submission;
    }

    async createSubmission(submissionData: SubmissionPayloadType) {
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

    public async updateSubmission(id: string, status: string) {
        try {
            const response = await this.submissionModel.findByIdAndUpdate(id, {
                status: status
            }, {new: true});
            if(!response) {
                throw new NotfoundError('Submission Id', id);
            }
            return response;
        } catch (error) {
            throw error;
        }
    }
}

export default SubmissionRepository;