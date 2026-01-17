import express from 'express';
import type { Request, Response } from 'express';
import { supabase } from '../lib/supabase';
import getUserUUIDFromAuth from '../utils/getUserUUIDFromAuth';
import getCreditCost from '../utils/getCreditCost';
import { openai } from '../lib/openai';
import { ParsedMessage, MemoryFragment } from '../types';
import { responseFormat } from '../helpers/gptSchema';

const router = express.Router();

const CHEAP_MODEL = process.env.OPENAI_MODEL_CHEAP!;
const EXPENSIVE_MODEL = process.env.OPENAI_MODEL_EXPENSIVE!;
const OPENAI_MODEL_CHEAP_TEMPERATURE =
  +process.env.OPENAI_MODEL_CHEAP_TEMPERATURE!;
const OPENAI_MODEL_EXPENSIVE_TEMPERATURE =
  +process.env.OPENAI_MODEL_EXPENSIVE_TEMPERATURE!;

function isValidMemoryFragment(obj: any): obj is MemoryFragment {
  return (
    obj &&
    typeof obj.content === 'string' &&
    obj.content !== '' &&
    typeof obj.interpretation === 'string' &&
    obj.interpretation !== '' &&
    typeof obj.reason === 'string' &&
    obj.reason !== '' &&
    typeof obj.weight === 'number' &&
    obj.weight >= 0 &&
    obj.weight <= 1 &&
    typeof obj.tags === 'object' &&
    Array.isArray(obj.tags) &&
    typeof obj.traits === 'object' &&
    Array.isArray(obj.traits) &&
    typeof obj.relates_to === 'object' &&
    Array.isArray(obj.relates_to)
  );
}

function isValidParsedMessage(obj: any): obj is ParsedMessage {
  return (
    obj &&
    typeof obj.message === 'string' &&
    typeof obj.response === 'string' &&
    typeof obj.message_summary === 'string' &&
    typeof obj.response_summary === 'string' &&
    typeof obj.response_could_be_better === 'object' &&
    typeof obj.response_could_be_better.value === 'boolean' &&
    typeof obj.response_could_be_better.reason === 'string' &&
    Array.isArray(obj.user_memory) &&
    Array.isArray(obj.aiik_memory) &&
    obj.user_memory.every(isValidMemoryFragment) &&
    obj.aiik_memory.every(isValidMemoryFragment)
  );
}

router.post('/gpt-proxy', async (req: Request, res: Response) => {
  const { messages = [], purpose = 'message' } = req.body;
  const user_id = await getUserUUIDFromAuth(req);

  if (!user_id) {
    return res.status(401).json({ error: 'Brak autoryzacji lub usera' });
  }

  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'Missing or invalid messages' });
  }

  const usedModels: string[] = [];
  let totalCreditsUsed = 0;

  try {
    console.log(`Try with cheap model: ${CHEAP_MODEL}`);
    const completionCheap = await openai.chat.completions.create({
      model: CHEAP_MODEL,
      temperature: OPENAI_MODEL_CHEAP_TEMPERATURE,
      messages,
    });

    usedModels.push(CHEAP_MODEL);
    totalCreditsUsed += getCreditCost(CHEAP_MODEL);
    const rawContent = completionCheap.choices[0]?.message?.content ?? '';
    let parsed: ParsedMessage | null = null;

    try {
      const candidate = JSON.parse(rawContent);
      if (isValidParsedMessage(candidate)) {
        parsed = candidate;
      }
    } catch (_err) {
      // ignore
    }

    if (!parsed || parsed.response_could_be_better.value) {
      console.log(`Fallback to expensive model: ${EXPENSIVE_MODEL}`);

      const completionExpensive = await openai.chat.completions.create({
        model: EXPENSIVE_MODEL,
        temperature: OPENAI_MODEL_EXPENSIVE_TEMPERATURE,
        messages,
        response_format: responseFormat,
      });

      usedModels.push(EXPENSIVE_MODEL);
      totalCreditsUsed += getCreditCost(EXPENSIVE_MODEL);

      try {
        const expensiveParsed: ParsedMessage = JSON.parse(
          completionExpensive.choices[0]?.message?.content ?? '',
        );

        if (!isValidParsedMessage(expensiveParsed)) {
          return res.status(500).json({
            error: 'Niepoprawny JSON z OpenAI (expensive model)',
          });
        }

        await supabase.from('credits_usage').insert({
          user_id,
          credits_used: totalCreditsUsed,
          meta: { purpose, models_used: usedModels },
        });

        return res.status(200).json({
          content: {
            ...expensiveParsed,
            model: EXPENSIVE_MODEL,
          },
        });
      } catch (err) {
        return res.status(500).json({
          error: 'Parsowanie JSON z drogiego modelu nie powiodło się.',
          err,
        });
      }
    }

    await supabase.from('credits_usage').insert({
      user_id,
      credits_used: totalCreditsUsed,
      meta: { purpose, models_used: usedModels },
    });

    return res.status(200).json({
      content: {
        ...parsed,
        model: CHEAP_MODEL,
      },
    });
  } catch (err) {
    console.error('🔥 GPT Proxy Error:', err);
    return res.status(500).json({ error: 'GPT proxy call failed', err });
  }
});

export default router;
