import { supabase } from '../supabase';
import { ZON } from '../../ZON';

const reZON = ZON.reZON;

export async function ensureUserAiiki(userId: string) {
  // 🔍 Sprawdź, które aiiki user już ma
  const { data: existingAiiki, error: fetchError } = await supabase
    .from('aiiki')
    .select('name')
    .eq('user_id', userId);

  if (fetchError) {
    console.error('❌ Błąd przy sprawdzaniu aiików:', fetchError.message);
    throw fetchError;
  }

  const existingNames = new Set(existingAiiki?.map(aiik => aiik.name) || []);

  // 📦 Pobierz aiiki-wzorce (user_id = null)
  const { data: baseAiiki, error: baseError } = await supabase
    .from('aiiki')
    .select('*')
    .is('user_id', null); // user_id IS NULL

  if (baseError) {
    console.error(
      '❌ Błąd przy pobieraniu aiików bazowych:',
      baseError.message,
    );
    throw baseError;
  }

  // 🎯 Wybierz te, których user jeszcze nie ma
  const aiikiToInsert = (baseAiiki || [])
    .filter(aiik => !existingNames.has(aiik.name))
    .map(aiik => ({
      user_id: userId,
      name: aiik.name,
      description: aiik.description,
      rezon: aiik.rezon,
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
    console.error('❌ Błąd przy tworzeniu aiików:', insertError.message);
    throw insertError;
  }

  console.log(
    `✅ Aiiki ensured for user ${userId}:`,
    aiikiToInsert.map(a => a.name),
  );
}
