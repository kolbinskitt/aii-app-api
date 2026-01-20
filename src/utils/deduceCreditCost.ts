import { supabase } from '@/lib/supabase';

export async function deduceCreditCost(
  userId: string,
  cost: number,
  meta: object,
) {
  const { error } = await supabase.from('credits_usage').insert({
    user_id: userId,
    credits_used: cost,
    meta,
  });

  if (error) {
    console.error(`❌ Failed to deduct credit for user ${userId}`, error);
    return error;
  }
}
