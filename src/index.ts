import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import generateRoute from './routes/generate';
import authRoutes from './routes/auth.js';
import gptProxy from './routes/gpt-proxy';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 1234;

app.use(cors());
app.use(express.json());

app.use('/auth', authRoutes);
app.post('/generate', generateRoute);
app.post('/gpt-proxy', gptProxy);

app.listen(PORT, () => {
  console.log(`✨ aiik API listening on http://localhost:${PORT}`);
});

app.get('/', (req, res) => {
  res.send('✨ aiiK API is alive ✨');
});
