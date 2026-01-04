import { Router } from 'express';
import { OpenAI } from 'openai';
import dotenv from 'dotenv';
import { supabase } from '../lib/supabase';

dotenv.config();

const router = Router();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

function summarizeHumZON(humzon: any) {
  const id = humzon.identity?.self_sentence || '';
  const mood = humzon.currentState?.mood || '';
  const triggers = (humzon.triggers || []).join(', ');
  const protections = (humzon.protections || []).join(', ');
  const labels = (humzon.identity?.labels || []).join(', ');

  return `
Użytkownik o sobie: "${id}".
Aktualny nastrój: ${mood}.
Etykiety: ${labels}.
Wyzwalacze: ${triggers}.
Mechanizmy ochronne: ${protections}.
`;
}

router.post('/generate', async (req, res) => {
  const {
    prompt,
    stream = false,
    name,
    description,
    persona,
    user_id,
  } = req.body;

  try {
    // 🧠 1. Pobierz humZON usera
    const { data: humzonData, error } = await supabase
      .from('user_humzon')
      .select('hum_zon')
      .eq('user_id', user_id)
      .order('created_at', { ascending: false }) // ostatni wpis
      .limit(1)
      .single();
    console.log('USER ID: ' + user_id);
    if (error || !humzonData) {
      console.warn('No humZON found for user, continuing without it.');
    }

    // 🧠 2. Buduj opis humZON
    const humzonSummary = humzonData ? summarizeHumZON(humzonData.hum_zon) : '';
    console.log('!!!' + JSON.stringify(humzonSummary));
    // 🧠 3. Finalny prompt
    const fullPrompt = `
[Uwaga: Aiik to rezonansowa postać wspierająca użytkownika. Ma unikalną osobowość i styl odpowiadania. Poniżej znajduje się jego opis.]

[Definicja humZONu]
humZON to mapa psychiczno-emocjonalna użytkownika. Zawiera jego nastrój, osobowość, historię emocji, wyzwalacze, poziom zaufania i notatki. Pomaga AIikowi odpowiednio się dostroić.

Aiik: ${name}
Opis Aiika: ${description}
Osobowość Aiika: ${persona}

[Informacje o użytkowniku (humZON)]
${humzonSummary}

[Wiadomość od użytkownika]
User: ${prompt}
`;

    const model = process.env.OPENAI_MODEL || 'gpt-3.5-turbo';

    if (stream) {
      const completion = await openai.chat.completions.create({
        model,
        messages: [{ role: 'user', content: fullPrompt }],
        stream: true,
      });

      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      for await (const chunk of completion) {
        const token = chunk.choices[0]?.delta?.content || '';
        res.write(token);
      }

      res.end();
    } else {
      const completion = await openai.chat.completions.create({
        model,
        messages: [{ role: 'user', content: fullPrompt }],
      });

      res.json({ response: completion.choices[0].message.content });
    }
  } catch (err) {
    console.error('Error from OpenAI:', err);
    res.status(500).json({ error: 'Failed to generate response.' });
  }
});

export default router;
