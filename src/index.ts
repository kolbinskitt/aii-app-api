import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import type { Request, Response } from 'express';
import authRoutes from './routes/auth';
import llmMessageResponse from './routes/llm-message-response';
import llmResponsesRedundancyCheck from './routes/llm-responses-redundancy-check';
import generateEmbedding from './routes/generate-embedding';
import imageProxy from './routes/image-proxy';
import generateRelatizon from './routes/generate-relatizon';
import getRelevantMemory from '@/routes/get-relevant-memory';
import sendEmail from '@/routes/send-email';

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
app.post('/llm-message-response', llmMessageResponse);
app.post('/llm-responses-redundancy-check', llmResponsesRedundancyCheck);
app.post('/generate-embedding', generateEmbedding);
app.use('/image-proxy', imageProxy);
app.post('/generate-relatizon', generateRelatizon);
app.use('/get-relevant-memory', getRelevantMemory);
app.use('/send-email', sendEmail);

app.listen(PORT, '0.0.0.0', () => {
  console.log(`API listening on port ${PORT}`);
});

app.get('/', (req: Request, res: Response) => {
  res.send('✨ aiiK API is alive ✨');
});
