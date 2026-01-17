import { OpenAI } from 'openai';

export const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function createEmbedding(text: string): Promise<number[] | null> {
  try {
    const response = await openai.embeddings.create({
      model: 'text-embedding-ada-002',
      input: text,
    });

    return response.data[0]?.embedding || null;
  } catch (error) {
    console.error('❌ Błąd przy generowaniu embeddingu:', error);
    return null;
  }
}
