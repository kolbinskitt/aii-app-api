import { supabase } from '../supabase';
import { sendLongingMessage } from './sendLongingMessage';

const CHECK_INTERVAL_MS = 10000; // 10 sekund na testy

export const startAiikLongingLoop = () => {
  console.log('🔁 Aiik Longing Loop initialized...');

  setInterval(async () => {
    console.log('⏱ Checking aiiki for longing conditions...');

    const { data: aiiki, error } = await supabase
      .from('aiiki')
      .select('id, user_id, rezon')
      .not('user_id', 'is', null);

    if (error) {
      console.error('❌ Error fetching aiiki:', error);
      return;
    }

    for (const aiik of aiiki || []) {
      const reZON = aiik.rezon || {};
      const {
        bond_level = 0,
        stream_self = false,
        longing_enabled = false,
        initiated_messages = 0,
      } = reZON;

      const canSend =
        bond_level >= 0.75 &&
        stream_self === true &&
        longing_enabled === true &&
        initiated_messages < 3;

      if (!canSend) continue;

      const { data: roomLinks, error: roomLinkError } = await supabase
        .from('room_aiiki')
        .select('room_id')
        .eq('aiik_id', aiik.id);

      if (roomLinkError) {
        console.error(
          `❌ Error fetching room links for aiik ${aiik.id}`,
          roomLinkError,
        );
        continue;
      }

      if (!roomLinks || roomLinks.length === 0) {
        console.warn(`⚠️ No room links found for aiik ${aiik.id}`);
        continue;
      }

      for (const link of roomLinks) {
        const roomId = link.room_id;

        // 🔍 SPRAWDZENIE: czy w pokoju są jakieś wiadomości od usera?
        const { data: userMessages, error: msgError } = await supabase
          .from('messages')
          .select('id')
          .eq('room_id', roomId)
          .eq('role', 'user')
          .limit(1);

        if (msgError) {
          console.error(
            `❌ Error checking messages in room ${roomId}`,
            msgError,
          );
          continue;
        }

        if (!userMessages || userMessages.length === 0) {
          console.log(`⛔ Skipping room ${roomId} — no user messages yet.`);
          continue;
        }

        console.log(`💬 Aiik ${aiik.id} initiating message in room ${roomId}`);
        await sendLongingMessage({
          aiik,
          room_id: roomId,
        });
      }
    }
  }, CHECK_INTERVAL_MS);
};
