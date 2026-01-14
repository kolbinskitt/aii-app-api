import express from 'express';

const router = express.Router();

router.post('/', async (req, res) => {
  const { model, messages } = req.body;

  try {
    const ollamaResponse = await fetch(
      `${process.env.LOCAL_LLM_URL}/api/chat`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: model ?? 'mistral',
          messages,
          stream: false,
        }),
      },
    );

    const data = await ollamaResponse.json(); // <-- TU SIĘ WYWALA
    res.json(data); // całość leci naraz
  } catch (err) {
    console.error('Błąd proxy do Mistrala:', err);
    res.status(500).json({ error: 'LLM Proxy error' });
  }
});

export default router;
