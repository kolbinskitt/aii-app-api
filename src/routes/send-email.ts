import express from 'express';
import type { Request, Response } from 'express';
import getUserUUIDFromAuth from '@/utils/getUserUUIDFromAuth';
import { Resend } from 'resend';
import { supabase } from '@/lib/supabase'; // zakładam, że masz już to
import { ADMIN_EMAIL, FROM_EMAIL } from '@/consts';

const router = express.Router();
const resend = new Resend(process.env.RESEND_API_KEY);

router.post('/', async (req: Request, res: Response) => {
  const { subject, body } = req.body;

  const user_id = await getUserUUIDFromAuth(req);
  if (!user_id) {
    return res.status(401).json({ error: 'Brak autoryzacji lub usera' });
  }

  // 🔐 Check if user is admin
  const { data: user, error } = await supabase
    .from('users')
    .select('role')
    .eq('id', user_id)
    .single();

  if (error || !user || user.role !== 'admin') {
    return res.status(403).json({ error: 'Brak dostępu – tylko dla adminów' });
  }

  // 🧼 Basic validation
  if (
    typeof subject !== 'string' ||
    !subject.trim() ||
    typeof body !== 'string' ||
    !body.trim()
  ) {
    return res.status(400).json({
      error: 'Brak lub nieprawidłowy subject/body',
    });
  }

  if (!ADMIN_EMAIL) {
    return res.status(500).json({
      error: 'Brak skonfigurowanego adresu ADMIN_EMAIL',
    });
  }

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: ADMIN_EMAIL,
      subject,
      text: body,
    });

    return res.status(200).json({ status: 'sent' });
  } catch (err) {
    console.error('🔥 Send email error:', err);
    return res.status(500).json({
      error: 'Nie udało się wysłać emaila',
    });
  }
});

export default router;
