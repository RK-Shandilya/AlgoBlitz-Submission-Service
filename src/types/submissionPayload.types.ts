export default interface SubmissionPayloadType {
    userId: string;
    problemId: string;
    code: string;
    language: string;
}

export interface TestCase {
    input: string,
    output: string
}

export interface CodeStub {
    language: string,
    startSnippet: string,
    userSnippet: string,
    endSnippet: string
}