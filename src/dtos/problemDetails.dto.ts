import { TestCase } from "../types/submissionPayload.types.js"
import { CodeStub } from "../types/submissionPayload.types.js"

export interface ProblemDto {
    data: {
        title: string,
        description: string,
        diffculty: string,
        testCases: TestCase[],
        codeStubs: CodeStub[],
        editorial?: string
    }
}