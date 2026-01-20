import getCreditCost from '@/utils/getCreditCost';
import getUserUUIDFromAuth from '@/utils/getUserUUIDFromAuth';
import type { Request } from 'express';
import { deduceCreditCost } from '@/utils/deduceCreditCost';
import { openai } from '@/lib/openai';
import { EMBEDDING_MODEL } from '@/consts';

const model = EMBEDDING_MODEL;

export async function createEmbedding(
  text: string,
  req: Request,
): Promise<number[] | null> {
  try {
    const user_id = await getUserUUIDFromAuth(req);

    if (!user_id) {
      return null;
    }

    const response = await openai.embeddings.create({
      model,
      input: text,
    });

    const error = await deduceCreditCost(user_id, getCreditCost(model), {
      purpose: 'embedding',
      models_used: model,
    });

    if (error) {
      return null;
    }

    return response.data[0]?.embedding || null;
  } catch (error) {
    console.error('❌ Błąd przy generowaniu embeddingu:', error);
    return null;
  }
}
