import fetchProblemDetails from '../apis/problemAdmin.api.js';
import SubmissionCreationError from '../errors/SubmissionCreation.error.js';
import SubmissionProducer from "../producers/submission.producer.js";
import javaTemplate from '../templates/java.template.js';

interface IMeta 
    {
        language: string,
        functionName: string,
        parameters: [
          {
            name: string,
            type: string
          },
          {
            name: string,
            type: string
          }
        ],
        returnType: string
      }

interface Ip {
    name: string,
    type: string
}

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

        console.log("First code", submissionPayload.code);
        const javaFunctionMeta = problemAdminApiResponse.data.functionMetadata.find((meta: IMeta) => meta.language === "java");
        const processedFunctionMeta = {
            language: javaFunctionMeta.language,
            functionName: javaFunctionMeta.functionName,
            parameters: javaFunctionMeta.parameters.map((p:Ip) => ({
              name: { type: p.name, required: true },
              type: { type: p.type, required: true }
            })),
            returnType: javaFunctionMeta.returnType
          };
        const completeCode = javaTemplate(submissionPayload.code, problemAdminApiResponse.data.testCases, processedFunctionMeta)
        submissionPayload.code = `${completeCode}`;
        const submission = await this.submissionRepository.createSubmission(submissionPayload);
        if (!submission) {
            throw new SubmissionCreationError('Failed to create a submission in the repository');
        }

        console.log('Submission created successfully', submission);

        const response = await SubmissionProducer({
            [submission._id.toString()]: {
                code: submission.code,
                language: submission.language,
                testCases: problemAdminApiResponse.data.testCases,
                userId,
                submissionId: submission._id,
            },
        });

        return { queueResponse: response, submission };
    }
};
