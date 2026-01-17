import { OpenAI } from 'openai';
import { supabase } from './supabase';
import getCreditCost from '@/utils/getCreditCost';
import getUserUUIDFromAuth from '@/utils/getUserUUIDFromAuth';
import type { Request } from 'express';

export const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const model = 'text-embedding-ada-002';

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

    await supabase.from('credits_usage').insert({
      user_id,
      credits_used: getCreditCost(model),
      meta: { purpose: 'embedding', models_used: model },
    });

    return response.data[0]?.embedding || null;
  } catch (error) {
    console.error('❌ Błąd przy generowaniu embeddingu:', error);
    return null;
  }
}
