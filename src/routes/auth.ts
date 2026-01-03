import { Router } from 'express';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

import { ensureUserAiiki } from '../lib/aiiki/ensureUserAiiki.js';

dotenv.config();

const router = Router();

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

router.post('/ensure-user', async (req, res) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.split(' ')[1];

  if (!token) return res.status(401).json({ error: 'No auth token' });

  try {
    // 🔓 Rozkoduj token lokalnie (bez walidacji)
    const payload = JSON.parse(
      Buffer.from(token.split('.')[1], 'base64').toString(),
    );
    const userId = payload.sub;

    if (!userId) return res.status(401).json({ error: 'No user ID in token' });

    // 🔐 Pobierz usera po ID
    const { data: userData, error } = await supabase.auth.admin.getUserById(
      userId,
    );

    if (error || !userData) {
      console.error('❌ Supabase getUserById error:', error);
      return res.status(401).json({ error: 'Cannot find user' });
    }

    // 🧠 Tworzymy aiiki
    await ensureUserAiiki(userId);
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('🔥 ensure-user fatal error:', err);
    return res.status(500).json({ error: 'Unhandled error' });
  }
});

export default router;
