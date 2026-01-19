import express from 'express';
import type { Request, Response } from 'express';
import { supabase } from '@/lib/supabase';
import { createEmbedding } from '@/lib/openai';
import getUserUUIDFromAuth from '@/utils/getUserUUIDFromAuth';
import {
  RELEVANT_MEMORY_LIMIT,
  RELEVANT_MEMORY_SIMILARITY_THRESHOLD,
} from '@/consts';

type UserAiikiMessage = {
  user: string;
  aiiki: {
    name: string;
    message: string;
  }[];
};

const router = express.Router();

const getMessage = (msg: any) =>
  `${msg.content} ${
    Array.isArray(msg.relates_to) && msg.relates_to.length > 0
      ? `
Tematy "relates_to": ${msg.relates_to.map(r => `\n - \`${r.value}\``).join(', ')}`
      : ''
  }
`;

router.post('/', async (req: Request, res: Response) => {
  const { userMessage, aiikId, roomId, lastMessagesAmount } = req.body;

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
        match_threshold: RELEVANT_MEMORY_SIMILARITY_THRESHOLD,
        match_count: RELEVANT_MEMORY_LIMIT,
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

    // Fetch aiik names (cache per request)
    const { data: aiiks, error: aiikError } = await supabase
      .from('aiiki')
      .select('id, name');

    if (aiikError) {
      console.error('Failed to fetch aiik names:', aiikError);
    }

    const aiikNameMap = new Map<string, string>();
    (aiiks ?? []).forEach((a: any) => {
      aiikNameMap.set(a.id, a.name);
    });

    // Fetch last N messages from this room
    const { data: recentMessages, error: messagesError } = await supabase
      .from('fractal_node')
      .select('*')
      .eq('room_id', roomId)
      .eq('type', 'message')
      .order('created_at', { ascending: false })
      .limit(lastMessagesAmount);

    if (messagesError) {
      console.error('Failed to fetch recent messages:', messagesError);
    }

    const messages: UserAiikiMessage[] = (recentMessages ?? []).reduceRight(
      (acc: UserAiikiMessage[], msg: any) => {
        // 🧍 USER MESSAGE → nowa fala
        if (msg.aiik_id === null) {
          acc.push({
            user: getMessage(msg),
            aiiki: [],
          });
          return acc;
        }

        // 🤖 AIK MESSAGE → doklejamy do ostatniej fali
        const aiikName =
          aiikNameMap.get(msg.aiik_id) ?? `Aiik(${msg.aiik_id.slice(0, 4)})`;

        // jeśli z jakiegoś powodu nie ma jeszcze usera (edge-case)
        if (acc.length === 0) {
          acc.push({
            user: '',
            aiiki: [],
          });
        }

        acc[acc.length - 1].aiiki.push({
          name: aiikName,
          message: getMessage(msg),
        });

        return acc;
      },
      [],
    );

    return res.status(200).json({ memory, messages });
  } catch (err) {
    console.error('get-relevant-memory error:', err);
    return res.status(500).json({ error: 'Unexpected error', details: err });
  }
});

export default router;
