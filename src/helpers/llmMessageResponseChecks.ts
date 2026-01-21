import {
  MemoryFragment,
  LLMMessageResponseParsedMessage,
  WeightedValue,
} from '@/types';

function isWeightedValueArray(arr: any): arr is WeightedValue[] {
  return (
    Array.isArray(arr) &&
    arr.every(
      item =>
        item &&
        typeof item.value === 'string' &&
        item.value !== '' &&
        typeof item.weight === 'number' &&
        item.weight >= 0 &&
        item.weight <= 1,
    )
  );
}

function isValidMemoryFragment(obj: any): obj is MemoryFragment {
  return (
    obj &&
    typeof obj.content === 'string' &&
    obj.content !== '' &&
    typeof obj.interpretation === 'string' &&
    obj.interpretation !== '' &&
    typeof obj.reason === 'string' &&
    obj.reason !== '' &&
    typeof obj.weight === 'number' &&
    obj.weight >= 0 &&
    obj.weight <= 1 &&
    isWeightedValueArray(obj.tags) &&
    isWeightedValueArray(obj.traits) &&
    isWeightedValueArray(obj.relates_to)
  );
}

function isValidEagerToFollowUp(obj: any): boolean {
  return (
    obj &&
    typeof obj.value === 'boolean' &&
    typeof obj.reason === 'string' &&
    obj.reason !== '' &&
    typeof obj.intensity === 'number' &&
    obj.intensity >= 0 &&
    obj.intensity <= 1 &&
    (obj.relates_to === undefined || isWeightedValueArray(obj.relates_to))
  );
}

export function isValidLLmMessageResponseParsedMessage(
  obj: any,
): obj is LLMMessageResponseParsedMessage {
  return (
    obj &&
    typeof obj.message === 'string' &&
    typeof obj.response === 'string' &&
    typeof obj.message_summary === 'string' &&
    typeof obj.response_summary === 'string' &&
    typeof obj.not_enought_data === 'boolean' &&
    // response_could_be_better
    typeof obj.response_could_be_better === 'object' &&
    obj.response_could_be_better !== null &&
    typeof obj.response_could_be_better.value === 'boolean' &&
    typeof obj.response_could_be_better.reason === 'string' &&
    // memory
    Array.isArray(obj.user_memory) &&
    Array.isArray(obj.aiik_memory) &&
    obj.user_memory.every(isValidMemoryFragment) &&
    obj.aiik_memory.every(isValidMemoryFragment) &&
    // internal_reaction
    typeof obj.internal_reaction === 'object' &&
    obj.internal_reaction !== null &&
    typeof obj.internal_reaction.shouldSpeak === 'boolean' &&
    typeof obj.internal_reaction.confidence === 'number' &&
    obj.internal_reaction.confidence >= 0 &&
    obj.internal_reaction.confidence <= 1 &&
    typeof obj.internal_reaction.intent === 'string' &&
    ['add', 'clarify', 'challenge', 'ask', 'hold'].includes(
      obj.internal_reaction.intent,
    ) &&
    typeof obj.internal_reaction.reason === 'string' &&
    // eager_to_follow_up ✅
    typeof obj.eager_to_follow_up === 'object' &&
    isValidEagerToFollowUp(obj.eager_to_follow_up)
  );
}
