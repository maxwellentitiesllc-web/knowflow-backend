// routes/tts.js — OpenAI TTS with true streaming + chunked delivery
const router = require('express').Router();

// ── STREAM ENDPOINT — pipes audio directly as it generates ───────────────
// POST /api/tts/stream  { text, voice, speed, chunk }
router.post('/stream', async (req, res) => {
  try {
    const { text, voice, speed } = req.body;
    if (!text) return res.status(400).json({ error: 'Text is required' });

    const response = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'tts-1',
        input: text.slice(0, 4096),
        voice: voice || 'nova',
        speed: speed || 0.72,
        response_format: 'mp3'
      })
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      return res.status(500).json({ error: err.error?.message || 'TTS failed' });
    }

    // Set headers for streaming
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Cache-Control', 'public, max-age=86400'); // cache 24hrs
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Transfer-Encoding', 'chunked');

    // Pipe directly — audio starts flowing to client immediately
    const reader = response.body.getReader();
    const pump = async () => {
      while (true) {
        const { done, value } = await reader.read();
        if (done) { res.end(); break; }
        if (!res.write(Buffer.from(value))) {
          // Backpressure — wait for drain
          await new Promise(resolve => res.once('drain', resolve));
        }
      }
    };
    await pump();

  } catch (err) {
    console.error('TTS stream error:', err.message);
    if (!res.headersSent) res.status(500).json({ error: err.message });
  }
});

// ── ORIGINAL BUFFERED ENDPOINT — keep for backwards compat ───────────────
router.post('/', async (req, res) => {
  try {
    const { text, voice, speed } = req.body;
    if (!text) return res.status(400).json({ error: 'Text is required' });

    const response = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'tts-1',
        input: text.slice(0, 4096),
        voice: voice || 'nova',
        speed: speed || 0.72,
        response_format: 'mp3'
      })
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      return res.status(500).json({ error: err.error?.message || 'TTS failed' });
    }

    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.setHeader('Access-Control-Allow-Origin', '*');
    const buffer = await response.arrayBuffer();
    res.send(Buffer.from(buffer));

  } catch (err) {
    console.error('TTS error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
