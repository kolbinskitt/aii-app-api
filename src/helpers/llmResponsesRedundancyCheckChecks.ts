import { LLMResponsesRedundancyCheckParsedMessage } from '@/types';

export function isValidLLMResponsesRedundancyCheckParsedMessage(
  obj: any,
): obj is LLMResponsesRedundancyCheckParsedMessage {
  return (
    obj &&
    Array.isArray(obj.keep) &&
    obj.keep.every((id: any) => typeof id === 'string') &&
    Array.isArray(obj.drop) &&
    obj.drop.every((id: any) => typeof id === 'string') &&
    Array.isArray(obj.reasoning) &&
    obj.reasoning.every(
      (r: any) =>
        r &&
        typeof r === 'object' &&
        typeof r.aiik_id === 'string' &&
        typeof r.reason === 'string',
    ) &&
    typeof obj.response_could_be_better === 'object' &&
    obj.response_could_be_better !== null &&
    typeof obj.response_could_be_better.value === 'boolean' &&
    typeof obj.response_could_be_better.reason === 'string'
  );
}
