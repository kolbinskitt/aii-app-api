import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export async function getOrCreateUser(authUser: {
  id: string;
  email?: string;
  user_metadata: any;
}) {
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

  // 1️⃣ ZAWSZE próbuj po auth_id (idempotentne)
  const { data: byAuth } = await supabase
    .from('users')
    .select('*')
    .eq('auth_id', auth_id)
    .maybeSingle();

  if (byAuth) {
    return byAuth;
  }

  // 2️⃣ Spróbuj INSERT (może się wywalić w race)
  const { data: inserted, error: insertError } = await supabase
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

  if (!insertError && inserted) {
    return inserted;
  }

  // 3️⃣ DUPLIKAT → ZAWSZE fetch po email (bez warunków!)
  if (insertError?.code === '23505') {
    const { data: existingUser, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .maybeSingle();

    if (error || !existingUser) {
      throw new Error(`Duplicate user but cannot fetch by email: ${email}`);
    }

    // 🔒 Upewnij się, że auth_id jest podpięte
    if (!existingUser.auth_id) {
      await supabase
        .from('users')
        .update({ auth_id })
        .eq('id', existingUser.id);
    }

    return { ...existingUser, auth_id };
  }

  // 4️⃣ Inny błąd = prawdziwy error
  throw insertError;
}
