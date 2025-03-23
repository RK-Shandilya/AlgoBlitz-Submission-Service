import fetchProblemDetails from "../apis/problemAdmin.api.js";
import BadrequestError from "../errors/badRequest.error.js";
import InternalServerError from "../errors/internalServer.error.js";
import submissionProducer from "../producers/submission.producer.js";
import SubmissionRepository from "../repositories/submission.repository.js";
import SubmissionPayloadType from "../types/submissionPayload.types.js";

type CustomInputs = [{
  input: string
}]

class SubmissionService {
  private submissionRepository;

  constructor(submissionRepository: SubmissionRepository) {
    this.submissionRepository = submissionRepository;
  }

  async addSubmission(submissionData: SubmissionPayloadType) {
    const problemId = submissionData.problemId;
    const userId = submissionData.userId;
    const problemResponseDetails = await fetchProblemDetails(problemId);
    if (!problemResponseDetails) {
      throw new InternalServerError(problemResponseDetails);
    }
    const languageCodeStub = problemResponseDetails.data.codeStubs.filter(
      (codeStub: any) =>
        codeStub.language.toLowerCase() == submissionData.language.toLowerCase()
    );
    const endSnippet = languageCodeStub[0].endSnippet
      ? languageCodeStub[0].endSnippet
      : "";
    submissionData.code = `${languageCodeStub[0].startSnippet}\n\n${submissionData.code}\n\n${endSnippet}`;
    console.log(submissionData.code);
    const submission = await this.submissionRepository.createSubmission(
      submissionData
    );
    if (!submission) {
      throw new BadrequestError("Submission Data", { submissionData });
    }
    await submissionProducer({
      [submission._id as unknown as string]: {
        code: submissionData.code,
        language: submissionData.language,
        testCases: problemResponseDetails.data.testCases,
        userId,
        submissionId: submission._id as unknown as string,
      },
    });
    return submission;
  }

  async getSubmission(submissionId: string) {
    const submission = await this.submissionRepository.getSubmission(
      submissionId
    );
    return submission;
  }

  async runTest(
    submissionData: SubmissionPayloadType,
    customInput: CustomInputs
  ) {
    console.log("inside services");
    const problemId = submissionData.problemId;
    const userId = submissionData.userId;

    const problemResponseDetails = await fetchProblemDetails(problemId);
    if (!problemResponseDetails) {
      throw new InternalServerError(problemResponseDetails);
    }

    const languageCodeStub = problemResponseDetails.data.codeStubs.filter(
      (codeStub: any) =>
        codeStub.language.toLowerCase() ===
        submissionData.language.toLowerCase()
    );
    console.log(problemResponseDetails.data);

    const languageRefernceSol = problemResponseDetails.data.referenceSolutions.filter(
      (refSol: any) => 
        refSol.language.toLowerCase() ===
        submissionData.language.toLowerCase()
    )
    console.log(languageRefernceSol);

    if (languageCodeStub.length === 0) {
      throw new BadrequestError("Language not supported", {
        language: submissionData.language,
      });
    }

    const endSnippet = languageCodeStub[0].endSnippet
      ? languageCodeStub[0].endSnippet
      : "";
    const fullCode = `${languageCodeStub[0].startSnippet}\n\n${submissionData.code}\n\n${endSnippet}`;

    const customTestId = `custom-${userId}-${Date.now()}`;

    await submissionProducer({
      [customTestId]: {
        code: fullCode,
        language: submissionData.language,
        testCases: customInput,
        userId,
        submissionId: customTestId,
        isCustomTest: true,
        refrenceSolution: languageRefernceSol.solution,
      },
    });

    return { customTestId };
  }
}

export default SubmissionService;
