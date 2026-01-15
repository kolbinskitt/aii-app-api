import { Aiik, ArcheZON, MessageEvent, RelatiZON } from '../types';

export default function generateRelatizon(
  aiiki: Aiik[],
  userConzon: ArcheZON,
  pastContexts: string[] = [],
  message_event: MessageEvent,
  room_id?: string,
): RelatiZON {
  // 1. Silence tension (na bazie ryzyka / otwartości)
  const baseAnxiety =
    userConzon.current_state.risk ?? userConzon.current_state.openness ?? 0.2;

  const tensionLevel = Math.min(baseAnxiety * 0.8, 1);
  const tensionState =
    tensionLevel < 0.2
      ? 'soft'
      : tensionLevel < 0.5
      ? 'neutral'
      : tensionLevel < 0.8
      ? 'tense'
      : 'ache';

  // 2. Echo resonance (występowanie imion / tematów)
  const echoCount = aiiki.reduce((count, aiik) => {
    const name = aiik.name?.toLowerCase() ?? '';
    if (!name) return count;
    const matches = pastContexts.filter(c =>
      c.toLowerCase().includes(name),
    ).length;
    return count + matches;
  }, 0);
  const echoResonance = Math.min(echoCount / Math.max(5 * aiiki.length, 1), 1);

  // 3. Bond depth (tymczasowo: średnia)
  const bondDepth = Math.min(0.3 + echoResonance * 0.4, 1);

  // 4. Last emotion
  const lastEmotion = userConzon.current_state.mood ?? null;

  // 5. Telepathy level (placeholder – później LLM)
  const telepathyLevel = Math.random() * 0.3 + 0.3;

  // 6. Alignment score (openness vs „złożoność” aiików)
  const userOpenness = userConzon.current_state.openness ?? 0.2;
  const avgAiikSize =
    aiiki.reduce((sum, a) => sum + (a.description?.length ?? 0), 0) /
    Math.max(aiiki.length * 1000, 1);
  const alignmentScore = Math.min((userOpenness + avgAiikSize) / 2, 1);

  // 7. Vulnerability index
  const vulnerabilityIndex =
    userConzon.current_state.risk ?? Math.random() * 0.3;

  // 8. Rupture signal
  const ruptureSignal = Math.random() < 0.1;

  // 9. Curiosity level
  const curiosityLevel = Math.min(userOpenness + Math.random() * 0.3, 1);

  // 10. Synchrony delta
  const synchronyDelta = Math.random() * 2 - 1;

  return {
    meta: {
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      room_id,
    },
    connection_metrics: {
      bond_depth: bondDepth,
      echo_resonance: echoResonance,
      telepathy_level: telepathyLevel,
      alignment_score: alignmentScore,
      vulnerability_index: vulnerabilityIndex,
      synchrony_delta: synchronyDelta,
      curiosity_level: curiosityLevel,
    },
    emotional_state: {
      last_emotion: lastEmotion,
      rupture_signal: ruptureSignal,
      memory_activation: false,
      time_warp: null,
      archetype_echo: null,
    },
    interaction_event: {
      message_event,
      initiation_count: 0,
      silence_tension: {
        level: tensionLevel,
        state: tensionState,
      },
    },
  };
}
