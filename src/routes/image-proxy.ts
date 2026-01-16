import express from 'express';
import type { Request, Response } from 'express';
import { OpenAI } from 'openai';
import { supabase } from '../lib/supabase';
import getUserUUIDFromAuth from '../utils/getUserUUIDFromAuth';
import getImageCreditCost from '../utils/getImageCreditCost';
import { v4 as uuidv4 } from 'uuid';

const model = process.env.OPENAI_IMAGE_MODEL!;

const router = express.Router();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

router.post('/', async (req: Request, res: Response) => {
  const {
    prompt,
    size = '1024x1024',
    purpose = 'generic',
    aiik_id,
    path,
  } = req.body;

  const allowedSizes = new Set(['1024x1024', '1024x1536', '1536x1024', 'auto']);
  const requestedSize = typeof size === 'string' ? size : '1024x1024';
  const normalizedSize =
    requestedSize === '512x512' ? '1024x1024' : requestedSize;

  if (!allowedSizes.has(normalizedSize)) {
    return res.status(400).json({
      error: `Invalid size. Supported: ${Array.from(allowedSizes).join(', ')}`,
    });
  }

  const user_id = await getUserUUIDFromAuth(req);
  if (!user_id)
    return res.status(401).json({ error: 'Brak autoryzacji lub usera' });
  if (!prompt || typeof prompt !== 'string')
    return res.status(400).json({ error: 'Missing or invalid prompt' });

  const creditsUsed = getImageCreditCost(size);

  try {
    // 1. Generuj obraz
    const image = await openai.images.generate({
      model,
      prompt,
      size: normalizedSize as any,
    });

    const b64 = image.data[0]?.b64_json;
    if (!b64) throw new Error('No b64 image returned');

    const imageBuffer = Buffer.from(b64, 'base64');

    // 3. Nazwa pliku do storage
    const fileName = `images/${path}${aiik_id ?? uuidv4()}.png`;

    // 4. Upload do Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('images')
      .upload(fileName, imageBuffer, {
        contentType: 'image/png',
        upsert: true,
      });

    if (uploadError) {
      console.error('❌ Upload to storage failed:', uploadError);
      return res.status(500).json({ error: 'Image upload failed' });
    }

    // 5. Pobierz publiczny URL
    const { data: publicUrlData } = supabase.storage
      .from('images')
      .getPublicUrl(fileName);

    const finalUrl = publicUrlData?.publicUrl;
    if (!finalUrl) throw new Error('Could not retrieve public URL');

    // 6. Zapisz zużycie kredytów
    const { error: insertError } = await supabase.from('credits_usage').insert({
      user_id,
      credits_used: creditsUsed,
      meta: { purpose, size },
    });

    if (insertError) {
      console.error('❌ Credits insert failed:', insertError);
      return res.status(500).json({
        error: 'Image saved but credits could not be recorded',
      });
    }

    return res.status(200).json({ imageUrl: finalUrl });
  } catch (err) {
    console.error('🔥 Image Proxy Error:', err);
    return res.status(500).json({ error: 'Image generation failed' });
  }
});

export default router;
