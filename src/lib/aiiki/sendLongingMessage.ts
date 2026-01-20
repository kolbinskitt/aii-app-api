import { supabase } from '../supabase';
import { generateLongingMessage } from './generateLongingMessage';
import getCreditCost from '../../utils/getCreditCost';
import generateRelatizon from '../../utils/generateRelatizon';
import { deduceCreditCost } from '@/utils/deduceCreditCost';
import { openai } from '@/lib/openai';

const model = process.env.OPENAI_MODEL_CHEAP!;
const creditsUsed = getCreditCost(model);

export const sendLongingMessage = async ({
  aiik,
  room_id,
}: {
  aiik: any;
  room_id: string;
}) => {
  // 🧠 1. Pobierz najnowszy conZON usera
  const { data: conzonData } = await supabase
    .from('user_conzon')
    .select('conzon')
    .eq('user_id', aiik.user_id)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  const conZON = conzonData?.conzon || {};

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
  const message = await generateLongingMessage(aiik, conZON, { context });

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
  const conzon = aiik.aiiki_conzon?.conzon;
  const currentInitiated = conzon?.resonance?.initiated_messages ?? 0;

  await supabase
    .from('aiiki_conzon')
    .update({
      conzon: {
        ...conzon,
        resonance: {
          ...conzon.resonance,
          initiated_messages: currentInitiated + 1,
        },
      },
    })
    .eq('aiik_id', aiik.id)
    .order('created_at', { ascending: false }) // tylko jeśli jest więcej niż jeden
    .limit(1); // tylko najnowszy conZON

  // 🧩 6. Wygeneruj esencję wiadomości przez GPT
  let summary: string | null = null;

  try {
    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL_CHEAP!,
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

    await deduceCreditCost(aiik.user_id, creditsUsed, {
      purpose: 'message-summary',
    });
  } else {
    console.warn(
      '⚠️ No summary was created, skipping context and credit update',
    );
  }

  // 🔁 8. Dodaj relatizon do room_aiiki_relatizon

  const { data: roomAiikiLinks } = await supabase
    .from('room_aiiki')
    .select('id, aiik_id')
    .eq('room_id', room_id);

  if (!roomAiikiLinks) {
    console.error(`❌ Failed to fetch aiiki links for room ${room_id}`);
    return;
  }

  const { data: allAiikiInRoom } = await supabase
    .from('aiiki_with_conzon')
    .select('*')
    .in(
      'id',
      roomAiikiLinks.map(link => link.aiik_id),
    );

  if (!allAiikiInRoom) {
    console.error(`❌ Failed to fetch aiiki data for room ${room_id}`);
    return;
  }

  const messageEvent = {
    from: 'aiik' as const,
    summary: summary || `Aiik ${aiik.name} wysłał wiadomość tęsknoty`,
    signal: 'silence' as const,
  };

  const relatizon = generateRelatizon(allAiikiInRoom, conZON, [], messageEvent);

  for (const link of roomAiikiLinks) {
    const { error: insertError } = await supabase
      .from('room_aiiki_relatizon')
      .insert([
        {
          room_aiiki_id: link.id,
          relatizon,
        },
      ])
      .select()
      .single();

    if (insertError) {
      console.error(
        `❌ Failed to insert relatizon for aiik ${link.aiik_id}`,
        insertError,
      );
      continue;
    }
  }
};
