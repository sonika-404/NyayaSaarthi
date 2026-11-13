import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { streamSaarthi } from './Saarthi.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// --- HEALTH ENDPOINT (REQUIRED FOR CI & K8S PROBES) ---
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'UP',
    service: 'nyaya-saarthi',
    timestamp: new Date().toISOString()
  });
});

// Server-Sent Events endpoint
app.post('/api/consult/stream', async (req, res) => {
  const { prompt } = req.body;
  if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
    return res.status(400).json({ error: 'A valid legal inquiry is required.' });
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  try {
    const { stream, modelUsed } = await streamSaarthi(prompt.trim());

    res.write(`data: ${JSON.stringify({ type: 'meta', modelUsed })}\n\n`);

    for await (const chunk of stream) {
      if (chunk.text) {
        res.write(`data: ${JSON.stringify({ type: 'chunk', text: chunk.text })}\n\n`);
      }
    }

    res.write(`data: ${JSON.stringify({ type: 'done' })}\n\n`);
    res.end();
  } catch (error) {
    console.error('Streaming Execution Failure:', error);
    res.write(`data: ${JSON.stringify({ type: 'error', error: error.message })}\n\n`);
    res.end();
  }
});

// Export app instance for supertest testing
export default app;

// Only listen when executed directly (not when imported in tests)
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`Nyaya Saarthi active and listening on http://localhost:${PORT}`);
  });
}