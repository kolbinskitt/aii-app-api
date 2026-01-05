import express from 'express';
import { OpenAI } from 'openai';
import { supabase } from '../lib/supabase';
import getUserUUIDFromAuth from '../utils/getUserUUIDFromAuth';
import getCreditCost from '../utils/getCreditCost';

const router = express.Router();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

router.post('/gpt-proxy', async (req, res) => {
  const { messages = [] } = req.body;
  const model = process.env.OPENAI_MODEL!;
  const creditsUsed = getCreditCost(model);
  const user_id = await getUserUUIDFromAuth(req);

  if (!user_id) {
    return res.status(401).json({ error: 'Brak autoryzacji lub usera' });
  }

  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'Missing or invalid messages' });
  }

  try {
    const completion = await openai.chat.completions.create({
      model,
      temperature: +process.env.TEMPERATURE!,
      messages,
    });

    const content = completion.choices[0]?.message?.content || '';

    const { error: insertError } = await supabase.from('credits_usage').insert({
      user_id,
      credits_used: creditsUsed,
    });

    if (insertError) {
      console.error('❌ Błąd przy insercie do credits_usage:', insertError);
      // Jeśli chcesz: możesz nadal zwrócić content, albo zablokować odpowiedź
      return res.status(500).json({
        error: 'GPT wygenerowano, ale nie udało się zapisać zużycia kredytów.',
      });
    }

    return res.status(200).json({ content });
  } catch (err) {
    console.error('🔥 GPT Proxy Error:', err);
    return res.status(500).json({ error: 'GPT proxy call failed' });
  }
});

export default router;
