import express from 'express';
import type { Request, Response } from 'express';
import generateRelatizon from '../utils/generateRelatizon';
import generateRelatizonViaGPT from '../utils/generateRelatizonViaGPT';

const router = express.Router();

router.post('/generate-relatizon', async (req: Request, res: Response) => {
  const { aiiki, userConZON, pastContexts, message_event } = req.body;
  console.log('generate-relatizon', { message_event });
  if (!aiiki || !userConZON || !message_event) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  // 🔮 Próbujemy wersję GPT
  const gptRelatizon = await generateRelatizonViaGPT(
    aiiki,
    userConZON,
    pastContexts,
    message_event,
  );

  if (gptRelatizon) {
    return res.json({ relatizon: gptRelatizon });
  }

  // 🔁 Fallback do lokalnej wersji
  const fallback = generateRelatizon(
    aiiki,
    userConZON,
    pastContexts,
    message_event,
  );

  return res.json({ relatizon: fallback });
});

export default router;
