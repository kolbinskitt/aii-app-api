import { ChatCompletionCreateParams } from 'openai/resources/chat/completions';

export const llmResponsesRedundancyCheckFormat: ChatCompletionCreateParams['response_format'] =
  {
    type: 'json_schema',
    json_schema: {
      name: 'llm_responses_redundancy_check',
      strict: true,
      schema: {
        type: 'object',
        additionalProperties: false,
        required: ['keep', 'drop', 'reasoning', 'response_could_be_better'],
        properties: {
          keep: {
            type: 'array',
            items: { type: 'string' },
          },
          drop: {
            type: 'array',
            items: { type: 'string' },
          },
          reasoning: {
            type: 'array',
            description: 'Uzasadnienia decyzji per aiik',
            items: {
              type: 'object',
              additionalProperties: false,
              required: ['aiik_id', 'reason'],
              properties: {
                aiik_id: { type: 'string' },
                reason: { type: 'string' },
              },
            },
          },
          response_could_be_better: {
            type: 'object',
            additionalProperties: false,
            required: ['value', 'reason'],
            properties: {
              value: { type: 'boolean' },
              reason: {
                type: 'string',
                minLength: 3,
                description:
                  'Uzasadnienie, dlaczego odpowiedź może być lepsza (lub potwierdzenie, że nie ma zastrzeżeń)',
              },
            },
          },
        },
      },
    },
  };
