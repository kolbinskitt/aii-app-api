import { Router } from 'express';
import { OpenAI } from 'openai';
import dotenv from 'dotenv';

dotenv.config();

const router = Router();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

router.post('/generate', async (req, res) => {
  const { prompt, stream = false, name, description, persona } = req.body;

  const model = process.env.OPENAI_MODEL || 'gpt-3.5-turbo';
  const fullPrompt = `${name}\n${description}\n${persona}\nUser: ${prompt}`;
  console.log(fullPrompt);
  try {
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
