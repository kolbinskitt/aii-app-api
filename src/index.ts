import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import authRoutes from './routes/auth.js';
import gptProxy from './routes/gpt-proxy';
import { startAiikLongingLoop } from './lib/aiiki/aiikLongingLoop';
import generateRelatizon from './routes/generate-relatizon.js';

dotenv.config();
const PORT = process.env.PORT || 1234;

const app = express();
app.use(express.json());
app.use(cors());
app.use('/auth', authRoutes);
app.post('/gpt-proxy', gptProxy);
app.post('/generate-relatizon', generateRelatizon);

app.listen(PORT, () => {
  console.log(`✨ aiik API listening on http://localhost:${PORT}`);
});

app.get('/', (req, res) => {
  res.send('✨ aiiK API is alive ✨');
});

startAiikLongingLoop();
