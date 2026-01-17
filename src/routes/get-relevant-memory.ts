import express from 'express';
import type { Request, Response } from 'express';
import { supabase } from '@/lib/supabase';
import { createEmbedding } from '@/lib/openai';
import getUserUUIDFromAuth from '@/utils/getUserUUIDFromAuth';

const router = express.Router();

const MEMORY_LIMIT = 12;
const SIMILARITY_THRESHOLD = 0.75;

router.post('/', async (req: Request, res: Response) => {
  const { userMessage, aiikId, roomId } = req.body;

  if (!userMessage || typeof userMessage !== 'string') {
    return res.status(400).json({ error: 'Missing or invalid userMessage' });
  }

  const userId = await getUserUUIDFromAuth(req);

  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized – missing userId' });
  }

  try {
    const embedding = await createEmbedding(userMessage, req);

    if (!embedding) {
      return res.status(500).json({ error: 'Embedding creation failed' });
    }

    const { data: memories, error } = await supabase.rpc(
      'match_fractal_memory',
      {
        query_embedding: embedding,
        match_threshold: SIMILARITY_THRESHOLD,
        match_count: MEMORY_LIMIT,
        user_id: userId,
        aiik_id: aiikId ?? null,
        room_id: roomId ?? null,
      },
    );

    if (error) {
      console.error('Supabase RPC error:', error);
      return res
        .status(500)
        .json({ error: 'Failed to fetch relevant memories' });
    }

    const memory = (memories ?? [])
      .filter((m: any) => !!m.content)
      .map((m: any) => ({
        type: m.type,
        content: m.content,
        interpretation: m.interpretation,
        reason: m.reason,
        weight: m.weight,
        tags: m.tags,
        traits: m.traits,
      }));

    return res.status(200).json({ memory });
  } catch (err) {
    console.error('get-relevant-memory error:', err);
    return res.status(500).json({ error: 'Unexpected error', details: err });
  }
});

export default router;
