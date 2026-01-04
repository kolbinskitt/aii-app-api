import express from 'express';
import { OpenAI } from 'openai';

const router = express.Router();

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

router.post('/gpt-proxy', async (req, res) => {
  const { model = 'gpt-4', temperature = 0.7, messages = [] } = req.body;

  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'Missing or invalid messages' });
  }

  try {
    const completion = await openai.chat.completions.create({
      model,
      temperature,
      messages,
    });

    const content = completion.choices[0]?.message?.content || '';
    return res.status(200).json({ content });
  } catch (err) {
    console.error('🔥 GPT Proxy Error:', err);
    return res.status(500).json({ error: 'GPT proxy call failed' });
  }
});

export default router;
