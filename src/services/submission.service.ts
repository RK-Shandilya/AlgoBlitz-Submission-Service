import fetchProblemDetails from '../apis/problemAdmin.api.js';
import SubmissionCreationError from '../errors/SubmissionCreation.error.js';
import SubmissionProducer from "../producers/submission.producer.js";

export class SubmissionService {
    private submissionRepository: any;

    constructor(submissionRepository: any) {
        this.submissionRepository = submissionRepository;
    }

    async pingCheck(): Promise<string> {
        return 'pong';
    }

    async addSubmission(submissionPayload: any): Promise<any> {
        const problemId = submissionPayload.problemId;
        const userId = submissionPayload.userId;

        const problemAdminApiResponse = await fetchProblemDetails(problemId);

        if (!problemAdminApiResponse) {
            throw new SubmissionCreationError('Failed to fetch problem details');
        }

        const languageCodeStub = problemAdminApiResponse.data.codeStubs.find(
            (codeStub: any) => codeStub.language.toLowerCase() === submissionPayload.language.toLowerCase()
        );

        if (!languageCodeStub) {
            throw new SubmissionCreationError('Invalid language');
        }

        submissionPayload.code = `${languageCodeStub.startSnippet}\n\n${submissionPayload.code}\n\n${languageCodeStub.endSnippet}`;

        const submission = await this.submissionRepository.createSubmission(submissionPayload);
        if (!submission) {
            throw new SubmissionCreationError('Failed to create a submission in the repository');
        }

        console.log('Submission created successfully', submission);

        const response = await SubmissionProducer({
            [submission._id.toString()]: {
                code: submission.code,
                language: submission.language,
                inputCase: problemAdminApiResponse.data.testCases[0].input,
                outputCase: problemAdminApiResponse.data.testCases[0].output,
                userId,
                submissionId: submission._id,
            },
        });

        return { queueResponse: response, submission };
    }
};
