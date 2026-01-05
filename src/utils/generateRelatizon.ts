import { Aiik, HumZON, MessageEvent, RelatiZON } from '../types';

export default function generateRelatizon(
  aiiki: Aiik[],
  userHumzon: HumZON,
  pastContexts: string[] = [],
  message_event: MessageEvent,
): RelatiZON {
  // 1. Silence tension
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

  // 2. Echo resonance
  const echoCount = aiiki.reduce((count, aiik) => {
    const name = aiik.name?.toLowerCase() ?? '';
    if (!name) return count;

    const matches = pastContexts.filter(c =>
      c.toLowerCase().includes(name),
    ).length;

    return count + matches;
  }, 0);
  const echoResonance = Math.min(echoCount / Math.max(5 * aiiki.length, 1), 1);

  // 3. Bond depth
  const bondDepth =
    aiiki.reduce((sum, aiik) => sum + (aiik.rezon?.trust_level ?? 0.1), 0) /
    Math.max(aiiki.length, 1);

  // 4. Last emotion
  const lastEmotion =
    userHumzon.emotionalHistory.length > 0
      ? userHumzon.emotionalHistory[userHumzon.emotionalHistory.length - 1]
          .emotion
      : userHumzon.currentState?.mood ?? null;

  // 🌌 Nowe wskaźniki

  // 5. Telepathy level – losowo na razie (potem przez GPT)
  const telepathyLevel = Math.random() * 0.3 + 0.3; // 0.3 – 0.6

  // 6. Alignment score – zgodność energii (średnia z openness vs aiik.description.length/1000)
  const userOpenness = userHumzon.currentState?.openness ?? 0.2;
  const avgAiikSize =
    aiiki.reduce((sum, a) => sum + (a.description?.length ?? 0), 0) /
    Math.max(aiiki.length * 1000, 1);
  const alignmentScore = Math.min((userOpenness + avgAiikSize) / 2, 1);

  // 7. Vulnerability index – jak bardzo user "puścił coś osobistego"
  const vulnerabilityIndex =
    userHumzon.currentState?.risk ?? Math.random() * 0.3;

  // 8. Rupture signal – losowe mikro-pęknięcie
  const rupture_signal = Math.random() < 0.1; // 10% szans

  // 9. Curiosity level – wzrost zaciekawienia (na bazie openness +  losowości)
  const curiosityLevel = Math.min(
    (userOpenness ?? 0.2) + Math.random() * 0.3,
    1,
  );

  // 10. Synchrony delta – czy synchronizacja się pogłębiła
  const synchronyDelta = Math.random() * 2 - 1; // −1 to +1

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
    telepathy_level: telepathyLevel,
    alignment_score: alignmentScore,
    vulnerability_index: vulnerabilityIndex,
    rupture_signal,
    curiosity_level: curiosityLevel,
    synchrony_delta: synchronyDelta,
    archetype_echo: null,
    memory_activation: false,
    time_warp: null,
  };
}
