import { supabase } from '../supabase';

export async function addToRoomContext(roomId: string, summary: string) {
  const { data: roomData, error: fetchError } = await supabase
    .from('rooms')
    .select('meta')
    .eq('id', roomId)
    .single();

  if (fetchError || !roomData) {
    console.error('❌ Failed to fetch room meta:', fetchError);
    return;
  }

  const context = roomData.meta?.context || [];
  const newContext = [...context, summary].slice(-10); // maks 10 wpisów

  await supabase
    .from('rooms')
    .update({ meta: { ...roomData.meta, context: newContext } })
    .eq('id', roomId);
}
