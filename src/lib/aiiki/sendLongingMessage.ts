import { supabase } from '../supabase';
import { generateLongingMessage } from './generateLongingMessage';
import OpenAI from 'openai';
import getCreditCost from '../../utils/getCreditCost';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const model = process.env.OPENAI_MODEL!;
const creditsUsed = getCreditCost(model);

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
    .select('humzon')
    .eq('user_id', aiik.user_id)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  const humZON = humzonData?.humzon || {};

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
      system_generated: true,
    },
  ]);

  if (messageError) {
    console.error(
      `❌ Failed to send longing message from aiik ${aiik.id}`,
      messageError,
    );
    return;
  }

  console.log(
    `✅ Longing message sent from aiik ${aiik.id} in room ${room_id}`,
  );

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

  // 🧩 6. Wygeneruj esencję wiadomości przez GPT
  let summary: string | null = null;

  try {
    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL!,
      temperature: +process.env.TEMPERATURE!,
      messages: [
        {
          role: 'system',
          content: `
Stwórz bardzo krótkie streszczenie tego, co powiedział aiik.
Skup się na *nowym sensie*, nie na samej gotowości do rozmowy.
Nie cytuj. Nie oceniaj.`,
        },
        {
          role: 'user',
          content: message,
        },
      ],
    });

    summary = completion.choices?.[0]?.message?.content?.trim() || null;
  } catch (err) {
    console.error('❌ Failed to generate summary of aiik message', err);
  }

  // 💰 7. Odejmij kredyt userowi za wygenerowanie esencji
  if (summary) {
    const updatedContext = [...context, `Aiik ${aiik.name}: ${summary}`];

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
      console.error(`❌ Failed to update room meta.context`, contextError);
    } else {
      console.log(`🧠 Updated context with aiik summary: ${summary}`);
    }

    const { error: creditError } = await supabase.from('credits_usage').insert([
      {
        user_id: aiik.user_id,
        credits_used: creditsUsed,
      },
    ]);

    if (creditError) {
      console.error(
        `❌ Failed to deduct credit for user ${aiik.user_id}`,
        creditError,
      );
    } else {
      console.log(
        `💳 Deducted ${creditsUsed} credit from user ${aiik.user_id}`,
      );
    }
  } else {
    console.warn(
      '⚠️ No summary was created, skipping context and credit update',
    );
  }
};
