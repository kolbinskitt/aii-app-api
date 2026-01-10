import { supabase } from '../supabase';
import { sendLongingMessage } from './sendLongingMessage';

const CHECK_INTERVAL_MS = 15 * 60 * 1000;
const MAX_MESSAGES_PER_SILENCE = 2;

export const startAiikLongingLoop = () => {
  // setInterval(async () => {
  //   const { data: aiiki, error } = await supabase
  //     .from('aiiki')
  //     .select('id, user_id, rezon, name')
  //     .not('user_id', 'is', null);
  //   if (error || !aiiki) {
  //     console.error('❌ Error fetching aiiki:', error);
  //     return;
  //   }
  //   for (const aiik of aiiki) {
  //     const reZON = aiik.rezon || {};
  //     const {
  //       bond_level = 0,
  //       stream_self = false,
  //       longing_enabled = false,
  //     } = reZON;
  //     if (!(bond_level >= 0.75 && stream_self && longing_enabled)) continue;
  //     const { data: roomLinks, error: roomLinkError } = await supabase
  //       .from('room_aiiki')
  //       .select('room_id')
  //       .eq('aiik_id', aiik.id);
  //     if (roomLinkError || !roomLinks) continue;
  //     for (const { room_id } of roomLinks) {
  //       // 1. Ostatnia wiadomość usera
  //       const { data: lastUserMsg, error: userMsgErr } = await supabase
  //         .from('messages')
  //         .select('created_at')
  //         .eq('room_id', room_id)
  //         .eq('role', 'user')
  //         .order('created_at', { ascending: false })
  //         .limit(1)
  //         .maybeSingle();
  //       if (userMsgErr) {
  //         console.error(
  //           `❌ Error checking user message in room ${room_id}`,
  //           userMsgErr,
  //         );
  //         continue;
  //       }
  //       if (!lastUserMsg || !lastUserMsg.created_at) {
  //         console.log(`⛔ No user message yet in room ${room_id}`);
  //         continue;
  //       }
  //       const userMsgTime = new Date(lastUserMsg.created_at).toISOString();
  //       // 2. Liczymy wiadomości aiika po tej dacie
  //       const { data: aiikMsgs, error: aiikMsgErr } = await supabase
  //         .from('messages')
  //         .select('id')
  //         .eq('room_id', room_id)
  //         .eq('role', 'aiik')
  //         .eq('aiik_id', aiik.id)
  //         .gte('created_at', userMsgTime);
  //       if (aiikMsgErr) {
  //         console.error(
  //           `❌ Error checking aiik messages in room ${room_id}`,
  //           aiikMsgErr,
  //         );
  //         continue;
  //       }
  //       const count = aiikMsgs?.length || 0;
  //       if (count >= MAX_MESSAGES_PER_SILENCE) {
  //         continue;
  //       }
  //       await sendLongingMessage({ aiik, room_id });
  //     }
  //   }
  // }, CHECK_INTERVAL_MS);
};
