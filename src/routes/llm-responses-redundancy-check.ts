import express from 'express';
import type { Request, Response } from 'express';
import getUserUUIDFromAuth from '@/utils/getUserUUIDFromAuth';
import getCreditCost from '@/utils/getCreditCost';
import { openai } from '@/lib/openai';
import { LLMResponsesRedundancyCheckParsedMessage } from '@/types';
import { llmResponsesRedundancyCheckFormat } from '@/helpers/llmResponsesRedundancyCheckSchema';
import { isValidLLMResponsesRedundancyCheckParsedMessage } from '@/helpers/llmResponsesRedundancyCheckChecks';
import { deduceCreditCost } from '@/utils/deduceCreditCost';

const router = express.Router();

const CHEAP_MODEL = process.env.OPENAI_MODEL_CHEAP!;
const EXPENSIVE_MODEL = process.env.OPENAI_MODEL_EXPENSIVE!;
const OPENAI_MODEL_CHEAP_TEMPERATURE =
  +process.env.OPENAI_MODEL_CHEAP_TEMPERATURE!;
const OPENAI_MODEL_EXPENSIVE_TEMPERATURE =
  +process.env.OPENAI_MODEL_EXPENSIVE_TEMPERATURE!;

router.post(
  '/llm-responses-redundancy-check',
  async (req: Request, res: Response) => {
    const { messages = [], purpose = 'responses-redundancy-check' } = req.body;
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
      let parsed: LLMResponsesRedundancyCheckParsedMessage | null = null;

      try {
        const candidate = JSON.parse(rawContent);
        if (isValidLLMResponsesRedundancyCheckParsedMessage(candidate)) {
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
          response_format: llmResponsesRedundancyCheckFormat,
        });

        usedModels.push(EXPENSIVE_MODEL);
        totalCreditsUsed += getCreditCost(EXPENSIVE_MODEL);

        try {
          const expensiveParsed: LLMResponsesRedundancyCheckParsedMessage =
            JSON.parse(completionExpensive.choices[0]?.message?.content ?? '');

          if (
            !isValidLLMResponsesRedundancyCheckParsedMessage(expensiveParsed)
          ) {
            return res.status(500).json({
              error: 'Niepoprawny JSON z OpenAI (expensive model)',
            });
          }

          const errorDeduceCreditCost = await deduceCreditCost(
            user_id,
            totalCreditsUsed,
            {
              purpose,
              models_used: usedModels,
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
            error: 'Parsowanie JSON z drogiego modelu nie powiodło się.',
            err,
          });
        }
      }

      const errorDeduceCreditCost = await deduceCreditCost(
        user_id,
        totalCreditsUsed,
        {
          purpose,
          models_used: usedModels,
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
          ...parsed,
          model: CHEAP_MODEL,
        },
      });
    } catch (err) {
      console.error('🔥 LLM response redundancy check error:', err);
      return res
        .status(500)
        .json({ error: 'LLM response redundancy check error', err });
    }
  },
);

export default router;
