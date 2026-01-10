import { Router } from 'express';
import type { Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { ensureUserAiiki } from '../lib/aiiki/ensureUserAiiki';

dotenv.config();

const router = Router();

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

async function getOrCreateUser(authUser: {
  id: string;
  email?: string;
  user_metadata: any;
}) {
  const auth_id = authUser.id;
  const email = authUser.email;
  const display_name =
    authUser.user_metadata?.full_name ||
    authUser.user_metadata?.name ||
    'Nowy użytkownik';

  const profile_pic_url = authUser.user_metadata?.avatar_url ?? null;

  // 1️⃣ Szukamy po auth_id
  const { data: userByAuth, error: errorByAuth } = await supabase
    .from('users')
    .select('*')
    .eq('auth_id', auth_id)
    .maybeSingle();

  if (errorByAuth) {
    console.error(
      '🔴 Błąd przy szukaniu usera po auth_id:',
      errorByAuth.message,
    );
  }

  if (userByAuth) {
    console.log('👤 Znaleziono usera po auth_id');
    return userByAuth;
  }

  // 2️⃣ Fallback po emailu (jeśli istnieje)
  if (email) {
    const { data: userByEmail, error: errorByEmail } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .maybeSingle();

    if (errorByEmail) {
      console.error(
        '🔴 Błąd przy szukaniu usera po emailu:',
        errorByEmail.message,
      );
    }

    if (userByEmail) {
      console.log('👤 Znaleziono usera po emailu – podpinam auth_id');

      const { error: updateError } = await supabase
        .from('users')
        .update({ auth_id })
        .eq('id', userByEmail.id);

      if (updateError) {
        console.error(
          '🔴 Błąd przy aktualizacji auth_id:',
          updateError.message,
        );
      }

      return { ...userByEmail, auth_id };
    }
  }

  // 3️⃣ Próba stworzenia nowego usera
  const { data: newUser, error: insertError } = await supabase
    .from('users')
    .insert({
      auth_id,
      email,
      display_name,
      profile_pic_url,
      uuic: '',
    })
    .select()
    .single();

  // ✋ Jeśli insert zwraca duplikat — fallback!
  if (insertError) {
    if (insertError.code === '23505') {
      console.warn(
        `🟡 User already exists by email ${email}, fallback to fetch`,
      );

      const { data: fallbackUser, error: fallbackError } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .maybeSingle();

      if (fallbackError || !fallbackUser) {
        throw (
          fallbackError ||
          new Error(
            `Could not fetch fallback user: ${JSON.stringify(fallbackError)}`,
          )
        );
      }

      return fallbackUser;
    }

    console.error('❌ Błąd przy tworzeniu usera:', insertError.message);
    throw insertError;
  }

  console.log('✅ Utworzono nowego usera:', newUser.id);
  return newUser;
}

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
