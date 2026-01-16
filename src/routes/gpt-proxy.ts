import express from 'express';
import type { Request, Response } from 'express';
import { supabase } from '../lib/supabase';
import getUserUUIDFromAuth from '../utils/getUserUUIDFromAuth';
import getCreditCost from '../utils/getCreditCost';
import { openai } from '../lib/openai';

interface ParsedMessage {
  message: string;
  response: string;
  message_summary: string;
  response_summary: string;
  user_memory: any[];
  aiik_memory: any[];
}

const router = express.Router();

const memoryFragmentSchema = {
  type: 'array',
  items: {
    type: 'object',
    additionalProperties: false,
    required: ['content', 'reason', 'type'],
    properties: {
      content: { type: 'string' },
      reason: { type: 'string' },
      type: {
        type: 'string',
        enum: [
          'memory',
          'insight',
          'context',
          'intention',
          'reinforcement',
          'question',
          'quote',
          'emotion',
          'emergence',
          'reference',
          'custom',
        ],
      },
    },
  },
};

router.post('/gpt-proxy', async (req: Request, res: Response) => {
  const { messages = [], purpose = 'message' } = req.body;
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

      // ✅ STRUCTURED OUTPUT — HARD GUARANTEE JSON
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'aiik_response',
          strict: true,
          schema: {
            type: 'object',
            additionalProperties: false,
            required: [
              'message',
              'response',
              'message_summary',
              'response_summary',
              'user_memory',
              'aiik_memory',
            ],
            properties: {
              message: { type: 'string' },
              response: { type: 'string' },
              message_summary: { type: 'string' },
              response_summary: { type: 'string' },
              user_memory: memoryFragmentSchema,
              aiik_memory: memoryFragmentSchema,
            },
          },
        },
      },
    });

    try {
      const parsed: ParsedMessage = JSON.parse(
        completion.choices[0]?.message.content,
      );

      if (!parsed) {
        return res
          .status(500)
          .json({ error: 'Brak content response z OpenAI' });
      }

      const { error: insertError } = await supabase
        .from('credits_usage')
        .insert({
          user_id,
          credits_used: creditsUsed,
          meta: { purpose },
        });

      if (insertError) {
        console.error('❌ Błąd przy insercie do credits_usage:', insertError);
        return res.status(500).json({
          error:
            'GPT wygenerowano, ale nie udało się zapisać zużycia kredytów.',
        });
      }

      // ✅ Zwracasz już OBIEKT, nie string
      return res.status(200).json({ content: parsed });
    } catch (err) {
      return res
        .status(500)
        .json({ error: 'Niepoprawny JSON response z OpenAI', err });
    }
  } catch (err) {
    console.error('🔥 GPT Proxy Error:', err);
    return res.status(500).json({ error: 'GPT proxy call failed' });
  }
});

export default router;
