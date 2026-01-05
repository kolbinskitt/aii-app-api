import express from 'express';
import { OpenAI } from 'openai';
import generateRelatizon from '../utils/generateRelatizon';

const router = express.Router();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

router.post('/generate-relatizon', async (req, res) => {
  const { aiiki, humzon, pastContexts, message_event } = req.body;

  if (!aiiki || !humzon || !message_event) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const relatizon = generateRelatizon(
    aiiki,
    humzon,
    pastContexts,
    message_event,
  );
  return res.json({ relatizon });
});

export default router;
