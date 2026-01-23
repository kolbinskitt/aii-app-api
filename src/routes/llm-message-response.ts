import express from 'express';
import type { Request, Response } from 'express';
import getUserUUIDFromAuth from '@/utils/getUserUUIDFromAuth';
import getCreditCost from '@/utils/getCreditCost';
import { openai } from '@/lib/openai';
import { LLMMessageResponseParsedMessage } from '@/types';
import { llmMessageResponseFormat } from '@/helpers/llmMessageResponseSchema';
import { isValidLLmMessageResponseParsedMessage } from '@/helpers/llmMessageResponseChecks';
import { deduceCreditCost } from '@/utils/deduceCreditCost';

const router = express.Router();

const EXPENSIVE_MODEL = process.env.OPENAI_MODEL_EXPENSIVE!;
const OPENAI_MODEL_EXPENSIVE_TEMPERATURE =
  +process.env.OPENAI_MODEL_EXPENSIVE_TEMPERATURE!;

router.post('/llm-message-response', async (req: Request, res: Response) => {
  const { messages = [], purpose = 'message' } = req.body;
  const user_id = await getUserUUIDFromAuth(req);

  if (!user_id) {
    return res.status(401).json({ error: 'Brak autoryzacji lub usera' });
  }

  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'Missing or invalid messages' });
  }

  let totalCreditsUsed = 0;

  try {
    console.log(`Expensive model: ${EXPENSIVE_MODEL}`);

    const completionExpensive = await openai.chat.completions.create({
      model: EXPENSIVE_MODEL,
      temperature: OPENAI_MODEL_EXPENSIVE_TEMPERATURE,
      messages,
      response_format: llmMessageResponseFormat,
    });
    totalCreditsUsed += getCreditCost(EXPENSIVE_MODEL);

    try {
      const expensiveParsed: LLMMessageResponseParsedMessage = JSON.parse(
        completionExpensive.choices[0]?.message?.content ?? '',
      );

      if (!isValidLLmMessageResponseParsedMessage(expensiveParsed)) {
        return res.status(500).json({
          error: 'Niepoprawny JSON z OpenAI (expensive model)',
        });
      }

      const errorDeduceCreditCost = await deduceCreditCost(
        user_id,
        totalCreditsUsed,
        {
          purpose,
          models_used: EXPENSIVE_MODEL,
        },
      );

      if (errorDeduceCreditCost) {
        return res.status(500).json({
          error: 'Error deduce credits cost',
          errorDeduceCreditCost,
        });
      }

      return res.status(200).json({
        content: {
          ...expensiveParsed,
          model: EXPENSIVE_MODEL,
        },
      });
    } catch (err) {
      return res.status(500).json({
        error: `Parsowanie JSON z modelu ${EXPENSIVE_MODEL} nie powiodło się.`,
        err,
      });
    }
  } catch (err) {
    console.error('🔥 LLM message response error:', err);
    return res.status(500).json({ error: 'LLM message response error', err });
  }
});

export default router;
