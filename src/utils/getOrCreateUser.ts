import { createClient } from '@supabase/supabase-js';
import { generateUuic } from '../helpers/generateUuic';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

type AuthUser = {
  id: string;
  email?: string;
  user_metadata: any;
};

export async function getOrCreateUser(authUser: AuthUser) {
  const auth_id = authUser.id;
  const email = authUser.email;

  if (!email) {
    throw new Error('Auth user has no email');
  }

  const display_name =
    authUser.user_metadata?.full_name ||
    authUser.user_metadata?.name ||
    'Nowy użytkownik';

  const profile_pic_url = authUser.user_metadata?.avatar_url ?? null;

  // 1️⃣ IDEMPOTENTNIE: auth_id
  const { data: byAuth, error: authErr } = await supabase
    .from('users')
    .select('*')
    .eq('auth_id', auth_id)
    .maybeSingle();

  if (authErr) {
    console.error('🔴 auth_id lookup error:', authErr.message);
  }

  if (byAuth) {
    return byAuth;
  }

  // 2️⃣ PRÓBA INSERT (race-safe)
  const userData = {
    auth_id,
    email,
    display_name,
    profile_pic_url,
    uuic: generateUuic(),
  };
  const { data: inserted, error: insertError } = await supabase
    .from('users')
    .insert(userData)
    .select()
    .single();

  if (!insertError && inserted) {
    return inserted;
  }

  // 3️⃣ DUPLIKAT EMAIL → ZAWSZE FETCH PO EMAIL
  if (insertError?.code === '23505') {
    const { data: existing, error: fetchErr } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .limit(1)
      .maybeSingle();

    if (fetchErr) {
      console.error('🔴 email fetch error:', fetchErr.message);
      throw fetchErr;
    }

    if (!existing) {
      throw new Error(`Duplicate user but cannot fetch by email: ${email}`);
    }

    // 🔒 Jeśli auth_id nie podpięte – podpinamy
    if (!existing.auth_id) {
      const { error: updateErr } = await supabase
        .from('users')
        .update({ auth_id })
        .eq('id', existing.id);

      if (updateErr) {
        console.error('🔴 auth_id update error:', updateErr.message);
        throw updateErr;
      }

      return { ...existing, auth_id };
    }

    // 🚨 Email należy do innego auth_id → REALNY BŁĄD
    if (existing.auth_id !== auth_id) {
      throw new Error(`Email ${email} already linked to another auth user`);
    }

    return existing;
  }

  // 4️⃣ PRAWDZIWY BŁĄD
  console.error('❌ user insert error:', insertError?.message);
  throw insertError;
}
