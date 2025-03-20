export interface AddSubmission {
    userId: string,
    problemId: string,
    code: string,
    language: string,
    status: string
}

const addSubmissionSchema = {
    type: 'object',
    required: ['userId', 'problemId', 'code', 'language'],
    properties: {
        userId: { type: 'string' },
        problemId: { type: 'string'},
        code: { type: 'string' },
        language: { type: 'string' },
        status: { type: 'string' }
    },
    additionalProperties: false
};

export default addSubmissionSchema;