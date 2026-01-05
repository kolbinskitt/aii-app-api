import { Aiik, HumZON, MessageEvent, RelatiZON } from '../types';

export default function generateRelatizon(
  aiiki: Aiik[],
  userHumzon: HumZON,
  pastContexts: string[] = [],
  message_event: MessageEvent,
): RelatiZON {
  // 1. Silence tension — bazuje na currentState usera
  const baseAnxiety =
    userHumzon.currentState?.risk ?? userHumzon.currentState?.openness ?? 0.2;

  const tensionLevel = Math.min(baseAnxiety * 0.8, 1);

  const tensionState =
    tensionLevel < 0.2
      ? 'soft'
      : tensionLevel < 0.5
      ? 'neutral'
      : tensionLevel < 0.8
      ? 'tense'
      : 'ache';

  // 2. Echo resonance — ile razy *jakikolwiek* aiik pojawia się w kontekście
  const echoCount = aiiki.reduce((count, aiik) => {
    const name = aiik.name?.toLowerCase() ?? '';
    if (!name) return count;

    const matches = pastContexts.filter(c =>
      c.toLowerCase().includes(name),
    ).length;

    return count + matches;
  }, 0);

  // normalizacja względem liczby aiików
  const echoResonance = Math.min(echoCount / Math.max(5 * aiiki.length, 1), 1);

  // 3. Bond depth — średni trust_level wszystkich aiików w pokoju
  const bondDepth =
    aiiki.reduce((sum, aiik) => sum + (aiik.rezon?.trust_level ?? 0.1), 0) /
    Math.max(aiiki.length, 1);

  // 4. Ostatnia emocja usera
  const lastEmotion =
    userHumzon.emotionalHistory.length > 0
      ? userHumzon.emotionalHistory[userHumzon.emotionalHistory.length - 1]
          .emotion
      : userHumzon.currentState?.mood ?? null;

  return {
    silence_tension: {
      level: tensionLevel,
      state: tensionState,
    },
    bond_depth: bondDepth,
    echo_resonance: echoResonance,
    initiation_count: 0,
    last_emotion: lastEmotion,
    message_event,
  };
}
