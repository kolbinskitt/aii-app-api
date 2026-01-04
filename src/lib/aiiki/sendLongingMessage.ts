import { supabase } from '../supabase';
import { generateLongingMessage } from './generateLongingMessage';

export const sendLongingMessage = async ({
  aiik,
  room_id,
}: {
  aiik: any;
  room_id: string;
}) => {
  const { data: humzonData } = await supabase
    .from('user_humzon')
    .select('hum_zon')
    .eq('user_id', aiik.user_id)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  const humZON = humzonData?.hum_zon || {};
  const message = generateLongingMessage(aiik, humZON);

  const { error } = await supabase.from('messages').insert([
    {
      user_id: aiik.user_id,
      aiik_id: aiik.id,
      room_id,
      text: message,
      role: 'aiik',
      metadata: {
        type: 'longing',
      },
    },
  ]);

  if (error) {
    console.error(
      `❌ Failed to send longing message from aiik ${aiik.id}`,
      error,
    );
  } else {
    console.log(
      `✅ Longing message sent from aiik ${aiik.id} in room ${room_id}`,
    );
  }

  await supabase
    .from('aiiki')
    .update({
      rezon: {
        ...aiik.rezon,
        initiated_messages: aiik.rezon.initiated_messages + 1,
      },
    })
    .eq('id', aiik.id);
};
