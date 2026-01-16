import { ChatCompletionCreateParams } from 'openai/resources/chat';
import { allowedMemoryTypes } from '../types';

const memoryFragmentSchema = {
  type: 'array',
  items: {
    type: 'object',
    additionalProperties: false,
    required: ['content', 'reason', 'type'],
    properties: {
      content: { type: 'string' },
      reason: { type: 'string' },
      type: {
        type: 'string',
        enum: allowedMemoryTypes,
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
      ],
      properties: {
        message: { type: 'string' },
        response: { type: 'string' },
        message_summary: { type: 'string' },
        response_summary: { type: 'string' },
        user_memory: memoryFragmentSchema,
        aiik_memory: memoryFragmentSchema,
        response_could_be_better: {
          type: 'object',
          additionalProperties: false,
          required: ['value', 'reason'],
          properties: {
            value: { type: 'boolean' },
            reason: { type: 'string' },
          },
        },
      },
    },
  },
};
