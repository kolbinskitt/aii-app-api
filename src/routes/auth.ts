import { Router } from 'express';
import type { Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { ensureUserAiiki } from '../lib/aiiki/ensureUserAiiki';
import { getOrCreateUser } from '../utils/getOrCreateUser';

dotenv.config();

const router = Router();

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

router.get('/ping', (req: Request, res: Response) => {
  res.send('auth ok');
});

router.post('/ensure-user', async (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.split(' ')[1];

  if (!token) return res.status(401).json({ error: 'No auth token' });

  try {
    // 🔓 Decode JWT (bez weryfikacji – OK przy service role)
    const payload = JSON.parse(
      Buffer.from(token.split('.')[1], 'base64').toString(),
    );

    const authUserId = payload.sub;
    if (!authUserId) {
      return res.status(401).json({ error: 'No user ID in token' });
    }

    // 🔐 Pobieramy auth usera
    const { data: authUser, error } = await supabase.auth.admin.getUserById(
      authUserId,
    );

    if (error || !authUser?.user) {
      console.error('❌ Auth user fetch error:', error?.message);
      return res.status(401).json({ error: 'Auth user not found' });
    }

    // 👤 Tworzymy lub pobieramy usera aplikacyjnego
    const user = await getOrCreateUser(authUser.user);

    // 🧠 Zapewniamy aiiki
    await ensureUserAiiki(user.id);

    return res.status(200).json(user);
  } catch (err: any) {
    console.error('🔥 ensure-user fatal error:', err.message || err);
    return res.status(500).json({ error: err.message || 'Unhandled error' });
  }
});

export default router;
