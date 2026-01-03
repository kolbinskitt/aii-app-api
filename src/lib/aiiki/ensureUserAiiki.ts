import { supabase } from '../supabase';
import { ZON } from '../../ZON';

const reZON = ZON.reZON;

export async function ensureUserAiiki(userId: string) {
  // 🔍 Pobierz już istniejące aiiki tego użytkownika (opcjonalnie, do logów)
  const { data: existingAiiki, error: fetchError } = await supabase
    .from('aiiki')
    .select('name')
    .eq('user_id', userId);

  if (fetchError) {
    console.error('Error checking existing aiiki:', fetchError);
    throw fetchError;
  }

  const existingNames = new Set(existingAiiki?.map(aiik => aiik.name) || []);

  // 📦 Stwórz listę aiików, które warto próbować wstawić
  const aiikiToInsert = Object.entries(reZON.aiiki)
    .filter(([name]) => !existingNames.has(name))
    .map(([_, aiik]) => ({
      user_id: userId,
      name: aiik.name,
      description: aiik.description,
      rezon: JSON.stringify(aiik.reZON),
      memory: {},
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }));

  if (aiikiToInsert.length === 0) {
    console.log(`✅ User ${userId} already has all aiiki`);
    return;
  }

  const { error: insertError } = await supabase
    .from('aiiki')
    .insert(aiikiToInsert as any, { ignoreDuplicates: true } as any);

  if (insertError && insertError.code !== '23505') {
    console.error('Error inserting aiiki:', insertError);
    throw insertError;
  }

  console.log(
    `✅ Aiiki ensured for user ${userId}:`,
    aiikiToInsert.map(a => a.name),
  );
}
