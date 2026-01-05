import { supabase } from '../lib/supabase';

// Funkcja pomocnicza: auth.id → users.id
export default async function getUserUUIDFromAuth(req: any) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return null;

  const token = authHeader.split(' ')[1];
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(token);

  if (error || !user) return null;

  const { data, error: userError } = await supabase
    .from('users')
    .select('id')
    .eq('auth_id', user.id)
    .maybeSingle();

  return userError ? null : data?.id || null;
}
