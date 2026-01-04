import { supabase } from '../supabase';
import { generateLongingMessage } from './generateLongingMessage';

export const sendLongingMessage = async ({
  aiik,
  room_id,
}: {
  aiik: any;
  room_id: string;
}) => {
  // 🧠 1. Pobierz najnowszy humZON usera
  const { data: humzonData } = await supabase
    .from('user_humzon')
    .select('hum_zon')
    .eq('user_id', aiik.user_id)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  const humZON = humzonData?.hum_zon || {};

  // 🧠 2. Pobierz meta z rooma
  const { data: roomData, error: roomError } = await supabase
    .from('rooms')
    .select('meta')
    .eq('id', room_id)
    .single();

  if (roomError) {
    console.error(
      `❌ Failed to fetch room meta for room ${room_id}`,
      roomError,
    );
    return;
  }

  const meta = roomData?.meta || {};
  const context = Array.isArray(meta.context) ? meta.context : [];

  // ✨ 3. Wygeneruj wiadomość przez GPT
  const message = await generateLongingMessage(aiik, humZON, { context });

  if (!message) {
    console.warn(
      `⚠️ No message generated for aiik ${aiik.id} in room ${room_id}`,
    );
    return;
  }

  // 💬 4. Zapisz wiadomość w tabeli messages
  const { error: messageError } = await supabase.from('messages').insert([
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

  if (messageError) {
    console.error(
      `❌ Failed to send longing message from aiik ${aiik.id}`,
      messageError,
    );
  } else {
    console.log(
      `✅ Longing message sent from aiik ${aiik.id} in room ${room_id}`,
    );
  }

  // 📈 5. Zaktualizuj licznik initiated_messages
  await supabase
    .from('aiiki')
    .update({
      rezon: {
        ...aiik.rezon,
        initiated_messages: (aiik.rezon.initiated_messages ?? 0) + 1,
      },
    })
    .eq('id', aiik.id);

  // 🧩 6. Stwórz esencję wiadomości aiika przez GPT i zaktualizuj meta.context
  let summary: string | null = null;

  try {
    const summaryRes = await fetch('http://localhost:1234/gpt-proxy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'gpt-4',
        temperature: 0.5,
        messages: [
          {
            role: 'system',
            content: `
Stwórz bardzo krótkie streszczenie tego, co powiedział aiik.
Skup się na *nowym sensie*, nie na samej gotowości do rozmowy.
Nie cytuj. Nie oceniaj.
`,
          },
          {
            role: 'user',
            content: message,
          },
        ],
      }),
    });

    const summaryJson = await summaryRes.json();
    summary = summaryJson?.content?.trim() || null;
  } catch (err) {
    console.error('❌ Failed to generate summary of aiik message', err);
  }

  if (summary) {
    const updatedContext = [...context, `Aiik: ${summary}`];

    const { error: contextError } = await supabase
      .from('rooms')
      .update({
        meta: {
          ...meta,
          context: updatedContext,
        },
      })
      .eq('id', room_id);

    if (contextError) {
      console.error(
        `❌ Failed to update room meta.context for room ${room_id}`,
        contextError,
      );
    } else {
      console.log(`🧠 Updated room meta.context with aiik message summary.`);
    }
  } else {
    console.warn('⚠️ No summary was created, skipping context update');
  }
};
