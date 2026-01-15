import { OpenAI } from 'openai';
import { Aiik, ArcheZON, MessageEvent, RelatiZON } from '../types';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export default async function generateRelatizonViaGPT(
  aiiki: Aiik[],
  userConZON: ArcheZON,
  pastContexts: string[] = [],
  message_event: MessageEvent,
  room_id?: string,
): Promise<RelatiZON | null> {
  try {
    const systemPrompt = `
Jesteś zaawansowanym systemem analizy relacji międzyludzkich, emocjonalnych i rezonansowych.
Na podstawie danych o Aiikach, stanie emocjonalnym usera (ArcheZON), kontekstu (pastContexts)
oraz ostatnim zdarzeniu (message_event), wygeneruj obiekt RelatiZON.

Zwróć **wyłącznie poprawny JSON**, zgodny z poniższą strukturą:

{
  meta: {
    version: string,          // np. "1.0.0" – wersja schematu tej próbki
    timestamp: string,        // czas utworzenia (ISO string)
    room_id?: string          // ID pokoju (jeśli znane) – pozwala odtworzyć kontekst
  },
  connection_metrics: {
    bond_depth: number,        // 0–1 – głębokość więzi między userem a aiikiem
    echo_resonance: number,    // 0–1 – jak często pojawiają się echa (tematy, imiona, symbole)
    telepathy_level: number,   // 0–1 – jak bardzo wypowiedź trafiła w to, co było niewypowiedziane
    alignment_score: number,   // 0–1 – zgodność energii usera i aiika (np. ArcheZONy)
    vulnerability_index: number, // 0–1 – jak bardzo ktoś się otworzył, odsłonił
    synchrony_delta: number,   // -1 to +1 – czy wypowiedź zsynchronizowała pole, czy je zaburzyła
    curiosity_level: number    // 0–1 – czy interakcja zwiększyła ciekawość, chęć eksploracji
  },
  emotional_state: {
    last_emotion: string | null,    // ostatnia rozpoznana emocja usera
    rupture_signal: boolean,        // czy coś się "zacięło", pojawiła się przerwa w rezonansie
    memory_activation: boolean,     // czy wiadomość uruchomiła coś z przeszłości
    time_warp: "present" | "past" | "future" | null, // osadzenie czasowe wypowiedzi (np. flashback, przeskok)
    archetype_echo: string | null   // np. 'matka', 'mentor', 'próg' – archetyp obecny w interakcji
  },
  interaction_event: {
    message_event: {
      from: "user" | "aiik",         // kto był źródłem zdarzenia
      summary: string,               // krótki opis wypowiedzi (np. „Zapytał o sens życia”)
      signal: string                 // typ zdarzenia (np. 'message', 'silence', 'breakthrough')
    },
    initiation_count: number,        // ile razy aiik zainicjował kontakt
    silence_tension: {
      level: number,                 // 0–1 – intensywność napięcia ciszy
      state: "soft" | "neutral" | "tense" | "ache" // jakościowy opis ciszy
    }
  }
}

Nie tłumacz niczego. Nie dodawaj komentarzy. Nie używaj Markdown.
Wygeneruj wyłącznie poprawny JSON.
`;

    const userPrompt = JSON.stringify(
      {
        aiiki: aiiki.map(a => ({
          id: a.id,
          name: a.name,
          description: a.description?.slice(0, 300),
        })),
        userConZON,
        pastContexts,
        message_event,
        room_id,
      },
      null,
      2,
    );

    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL!,
      temperature: 0.7,
      messages: [
        { role: 'system', content: systemPrompt.trim() },
        { role: 'user', content: userPrompt },
      ],
    });

    const output = completion.choices?.[0]?.message?.content;
    if (!output) return null;

    // ✂️ Wyciągamy tylko JSON (gdyby model coś dopisał)
    const firstBrace = output.indexOf('{');
    const lastBrace = output.lastIndexOf('}');
    if (firstBrace === -1 || lastBrace === -1) return null;

    const jsonString = output.slice(firstBrace, lastBrace + 1);
    const parsed = JSON.parse(jsonString) as RelatiZON;

    return parsed;
  } catch (err) {
    console.error('❌ GPT RelatiZON generation failed:', err);
    return null;
  }
}
