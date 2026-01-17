import { MemoryFragment, ParsedMessage } from '@/types';

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
    typeof obj.tags === 'object' &&
    Array.isArray(obj.tags) &&
    typeof obj.traits === 'object' &&
    Array.isArray(obj.traits) &&
    typeof obj.relates_to === 'object' &&
    Array.isArray(obj.relates_to)
  );
}

export function isValidParsedMessage(obj: any): obj is ParsedMessage {
  return (
    obj &&
    typeof obj.message === 'string' &&
    typeof obj.response === 'string' &&
    typeof obj.message_summary === 'string' &&
    typeof obj.response_summary === 'string' &&
    typeof obj.response_could_be_better === 'object' &&
    typeof obj.response_could_be_better.value === 'boolean' &&
    typeof obj.response_could_be_better.reason === 'string' &&
    Array.isArray(obj.user_memory) &&
    Array.isArray(obj.aiik_memory) &&
    obj.user_memory.every(isValidMemoryFragment) &&
    obj.aiik_memory.every(isValidMemoryFragment)
  );
}
