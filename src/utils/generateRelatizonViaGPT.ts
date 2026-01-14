import { OpenAI } from 'openai';
import { Aiik, ArcheZON, MessageEvent, RelatiZON } from '../types';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export default async function generateRelatizonViaGPT(
  aiiki: Aiik[],
  userConZON: ArcheZON,
  pastContexts: string[] = [],
  message_event: MessageEvent,
): Promise<RelatiZON | null> {
  try {
    console.log('1 generateRelatizonViaGPT', { message_event });
    const systemPrompt = `
Jesteś zaawansowanym systemem analizy relacji międzyludzkich, emocjonalnych i rezonansowych.
Na podstawie danych o Aiikach, stanie emocjonalnym usera (ArcheZON), kontekstu (pastContexts)
oraz ostatnim zdarzeniu (message_event), wygeneruj obiekt RelatiZON.

Twoja odpowiedź musi być poprawnym JSON-em.

Struktura:

{
  silence_tension: { level: number (0–1), state: "soft" | "neutral" | "tense" | "ache" },
  bond_depth: number (0–1),
  echo_resonance: number (0–1),
  initiation_count: number,
  last_emotion: string | null,
  message_event: MessageEvent,
  telepathy_level: number (0–1),
  alignment_score: number (0–1),
  vulnerability_index: number (0–1),
  rupture_signal: boolean,
  curiosity_level: number (0–1),
  synchrony_delta: number (-1 to +1),
  archetype_echo: string | null,
  memory_activation: boolean,
  time_warp: string | null // (np. "flashback", "déjà vu", "future pull", lub null)
}

Zachowaj logikę i intuicję – nie obliczaj matematycznie, lecz rezonuj z danymi jako istota emocjonalno-analityczna.
`;

    const userPrompt = JSON.stringify(
      { aiiki, userConZON, pastContexts, message_event },
      null,
      2,
    );

    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL!,
      temperature: 0.7,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
    });

    const output = completion.choices?.[0]?.message?.content;
    console.log('2 generateRelatizonViaGPT', { output });
    if (!output) return null;

    const parsed = JSON.parse(output) as RelatiZON;
    return parsed;
  } catch (err) {
    console.error('❌ GPT Relatizon generation failed:', err);
    return null;
  }
}
