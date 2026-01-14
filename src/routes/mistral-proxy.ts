import express from 'express';
import type { Request, Response } from 'express';
import { supabase } from '../lib/supabase';
import getUserUUIDFromAuth from '../utils/getUserUUIDFromAuth';
import getCreditCost from '../utils/getCreditCost';

const router = express.Router();

function messagesToPrompt(messages: { role: string; content: string }[]) {
  return (
    messages
      .map(msg => {
        if (msg.role === 'system') return `${msg.content.trim()}\n\n`;
        if (msg.role === 'user') return `### Human:\n${msg.content.trim()}\n\n`;
        if (msg.role === 'assistant')
          return `### Assistant:\n${msg.content.trim()}\n\n`;
        return '';
      })
      .join('') + '### Assistant:'
  );
}

router.post('/', async (req: Request, res: Response) => {
  const {
    messages = [],
    purpose = 'message',
    model = process.env.LLM_PROD_MODEL!,
    temperature = +process.env.LLM_PROD_TEMPERATURE! || 0.7,
    max_tokens = 512,
    stop = ['### Human:', '### Assistant:'],
  } = req.body;

  const llmUrl = process.env.LLM_PROD_URL!;
  const apiKey = process.env.LLM_PROD_KEY!;
  const user_id = await getUserUUIDFromAuth(req);
  const creditsUsed = getCreditCost(model);

  if (!user_id) {
    return res.status(401).json({ error: 'Brak autoryzacji lub usera' });
  }

  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'Brak lub niepoprawne messages' });
  }

  const prompt = messagesToPrompt(messages);

  try {
    const runpodRes = await fetch(llmUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        prompt,
        temperature,
        max_tokens,
        stop,
      }),
    });

    const data = await runpodRes.json();

    const output =
      data?.choices?.[0]?.text?.trim() ||
      data?.choices?.[0]?.message?.content?.trim() ||
      '';

    const { error: insertError } = await supabase.from('credits_usage').insert({
      user_id,
      credits_used: creditsUsed,
      meta: { purpose, model },
    });

    if (insertError) {
      console.error('❌ Błąd przy insercie do credits_usage:', insertError);
      return res.status(500).json({
        error:
          'Mistral wygenerował odpowiedź, ale nie zapisano użycia kredytów.',
      });
    }

    return res.status(200).json({ content: output });
  } catch (err) {
    console.error('🔥 Błąd proxy do Mistrala:', err);
    return res
      .status(500)
      .json({ error: 'Nie udało się połączyć z Mistralem.' });
  }
});

export default router;
