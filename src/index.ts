import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import type { Request, Response } from 'express';
import authRoutes from './routes/auth';
import gptProxy from './routes/gpt-proxy';
import imageProxy from './routes/image-proxy';
import { startAiikLongingLoop } from './lib/aiiki/aiikLongingLoop';
import generateRelatizon from './routes/generate-relatizon';

dotenv.config();

const PORT = Number(process.env.PORT) || 1234;

const app = express();
app.use(express.json());
app.use(cors());
app.use(
  cors({
    origin: [
      'http://localhost:5173',
      'https://kolbinskitt.github.io',
      'https://kolbinskitt.github.io/aii-app',
    ],
    credentials: true,
  }),
);

app.use('/auth', authRoutes);
app.post('/gpt-proxy', gptProxy);
app.use('/image-proxy', imageProxy);
app.post('/generate-relatizon', generateRelatizon);

app.listen(PORT, '0.0.0.0', () => {
  console.log(`API listening on port ${PORT}`);
});

app.get('/', (req: Request, res: Response) => {
  res.send('✨ aiiK API is alive ✨');
});

startAiikLongingLoop();
