import { ChatCompletionCreateParams } from 'openai/resources/chat';

const weightedValueSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['value', 'weight'],
  properties: {
    value: {
      type: 'string',
    },
    weight: {
      type: 'number',
      minimum: 0,
      maximum: 1,
    },
  },
};

const memoryFragmentSchema = {
  type: 'array',
  items: {
    type: 'object',
    additionalProperties: false,
    required: [
      'content',
      'interpretation',
      'reason',
      'weight',
      'tags',
      'traits',
      'relates_to',
    ],
    properties: {
      content: {
        type: 'string',
      },
      interpretation: {
        type: 'string',
      },
      reason: {
        type: 'string',
      },
      weight: {
        type: 'number',
        minimum: 0,
        maximum: 1,
      },
      tags: {
        type: 'array',
        items: weightedValueSchema,
      },
      traits: {
        type: 'array',
        items: weightedValueSchema,
      },
      relates_to: {
        type: 'array',
        items: weightedValueSchema,
      },
    },
  },
};

export const responseFormat: ChatCompletionCreateParams['response_format'] = {
  type: 'json_schema',
  json_schema: {
    name: 'aiik_response',
    strict: true,
    schema: {
      type: 'object',
      additionalProperties: false,
      required: [
        'message',
        'response',
        'message_summary',
        'response_summary',
        'user_memory',
        'aiik_memory',
        'response_could_be_better',
        'not_enought_data',
      ],
      properties: {
        message: {
          type: 'string',
        },
        response: {
          type: 'string',
        },
        message_summary: {
          type: 'string',
        },
        response_summary: {
          type: 'string',
        },
        user_memory: memoryFragmentSchema,
        aiik_memory: memoryFragmentSchema,
        response_could_be_better: {
          type: 'object',
          additionalProperties: false,
          required: ['value', 'reason'],
          properties: {
            value: {
              type: 'boolean',
            },
            reason: {
              type: 'string',
            },
          },
        },
        not_enought_data: {
          type: 'boolean',
        },
      },
    },
  },
};
