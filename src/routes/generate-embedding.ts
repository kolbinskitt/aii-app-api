import express from 'express';
import type { Request, Response } from 'express';
import { createEmbedding } from '@/lib/openai';
import getUserUUIDFromAuth from '@/utils/getUserUUIDFromAuth';

const router = express.Router();

router.post('/generate-embedding', async (req: Request, res: Response) => {
  const { text } = req.body;

  const user_id = await getUserUUIDFromAuth(req);
  if (!user_id) {
    return res.status(401).json({ error: 'Brak autoryzacji lub usera' });
  }

  if (typeof text !== 'string' || !text.trim()) {
    return res
      .status(400)
      .json({ error: 'Brak lub nieprawidłowy tekst do embeddingu' });
  }

  try {
    const embedding = await createEmbedding(text);

    if (!embedding) {
      return res
        .status(500)
        .json({ error: 'Brak embeddingu w odpowiedzi OpenAI' });
    }

    return res.status(200).json({ embedding });
  } catch (err) {
    console.error('🔥 Embedding Error:', err);
    return res
      .status(500)
      .json({ error: 'Nie udało się wygenerować embeddingu' });
  }
});

export default router;
