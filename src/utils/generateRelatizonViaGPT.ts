import { OpenAI } from 'openai';
import { Aiik, HumZON, MessageEvent, RelatiZON } from '../types';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export default async function generateRelatizonViaGPT(
  aiiki: Aiik[],
  humzon: HumZON,
  pastContexts: string[] = [],
  message_event: MessageEvent,
): Promise<RelatiZON | null> {
  try {
    const systemPrompt = `
Jesteś zaawansowanym systemem analizy relacji międzyludzkich i emocjonalnych.
Na podstawie danych o Aiikach, stanie emocjonalnym usera (humZON) i ostatnim zdarzeniu (message_event),
wygeneruj obiekt RelatiZON, zawierający:

- silence_tension: { level: number (0–1), state: "soft" | "neutral" | "tense" | "ache" }
- bond_depth: number (0–1)
- echo_resonance: number (0–1)
- initiation_count: 0
- last_emotion: string (lub null)
- message_event: dokładnie taki jak wejściowy

Zachowuj logikę, ale nie obliczaj matematycznie — rezonuj z danymi jak istota emocjonalno-analityczna.
`;

    const userPrompt = JSON.stringify(
      { aiiki, humzon, pastContexts, message_event },
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
    if (!output) return null;

    // Próbujemy sparsować jako JSON
    const parsed = JSON.parse(output) as RelatiZON;
    return parsed;
  } catch (err) {
    console.error('❌ GPT Relatizon generation failed:', err);
    return null;
  }
}
