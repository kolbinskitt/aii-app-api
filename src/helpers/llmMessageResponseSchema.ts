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
      content: { type: 'string' },
      interpretation: { type: 'string' },
      reason: { type: 'string' },
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

export const llmMessageResponseFormat: ChatCompletionCreateParams['response_format'] =
  {
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
          'not_enought_data',
          'internal_reaction',
          'eager_to_follow_up',
        ],
        properties: {
          message: { type: 'string' },
          response: { type: 'string' },
          message_summary: { type: 'string' },
          response_summary: { type: 'string' },

          user_memory: memoryFragmentSchema,
          aiik_memory: memoryFragmentSchema,

          not_enought_data: {
            type: 'boolean',
          },

          internal_reaction: {
            type: 'object',
            additionalProperties: false,
            required: ['shouldSpeak', 'confidence', 'intent', 'reason'],
            properties: {
              shouldSpeak: {
                type: 'boolean',
                description:
                  'Czy aiik uważa, że jego wypowiedź wnosi istotną wartość do aktualnej rozmowy',
              },
              confidence: {
                type: 'number',
                minimum: 0,
                maximum: 1,
                description:
                  'Jak silna jest potrzeba zabrania głosu w tej chwili (nie pewność faktów)',
              },
              intent: {
                type: 'string',
                enum: ['add', 'clarify', 'challenge', 'ask', 'hold'],
                description:
                  'Intencja potencjalnej wypowiedzi (dla Orchestratora, nie dla UI)',
              },
              reason: {
                type: 'string',
                description:
                  'Krótki powód decyzji (tylko do debugowania, nigdy do UI)',
              },
            },
          },

          eager_to_follow_up: {
            type: 'object',
            additionalProperties: false,
            required: ['value', 'reason', 'intensity', 'relates_to'],
            properties: {
              value: {
                type: 'boolean',
                description:
                  'Czy aiik chce samodzielnie kontynuować rozmowę, jeśli użytkownik na to pozwoli',
              },
              reason: {
                type: 'string',
                description:
                  'Dlaczego aiik chce (lub nie chce) kontynuować rozmowę',
              },
              intensity: {
                type: 'number',
                minimum: 0,
                maximum: 1,
                description:
                  'Jak silna jest potrzeba kontynuacji (0.0 – brak, 1.0 – bardzo silna)',
              },
              relates_to: {
                type: 'array',
                items: weightedValueSchema,
                description:
                  'Opcjonalne tematy, których dotyczy chęć kontynuacji (np. trust, meaning, identity)',
              },
            },
          },
        },
      },
    },
  };
