// routes/tts.js — OpenAI Text-to-Speech for KnowFlow meditations
const router = require('express').Router();

// POST /api/tts
router.post('/', async (req, res) => {
  try {
    const { text, voice, speed } = req.body;
    if (!text) return res.status(400).json({ error: 'Text is required' });
    if (!process.env.OPENAI_API_KEY) {
      console.error('TTS error: OPENAI_API_KEY not set on server');
      return res.status(500).json({ error: 'Narration service not configured' });
    }

    // Truncate to reasonable length (OpenAI TTS max is 4096 chars)
    const cleanText = String(text).slice(0, 4000);
    const voiceName = voice || 'nova';
    const speedVal  = typeof speed === 'number' ? speed : 0.85;

    // Timeout — OpenAI can be slow on long text; abort after 45 s
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 45000);

    let response;
    try {
      response = await fetch('https://api.openai.com/v1/audio/speech', {
        method: 'POST',
        signal: controller.signal,
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'tts-1',
          input: cleanText,
          voice: voiceName,   // nova = warm, calm — perfect for meditation
          speed: speedVal,
          response_format: 'mp3'
        })
      });
    } finally {
      clearTimeout(timeout);
    }

    if (!response.ok) {
      let errMsg = 'TTS failed';
      try {
        const err = await response.json();
        errMsg = err.error?.message || errMsg;
      } catch (e) { /* non-JSON error */ }
      console.error('OpenAI TTS error:', response.status, errMsg);
      return res.status(502).json({ error: errMsg });
    }

    // Stream audio back to client
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.setHeader('Access-Control-Allow-Origin', '*');

    const buffer = await response.arrayBuffer();
    res.send(Buffer.from(buffer));

  } catch (err) {
    if (err.name === 'AbortError') {
      console.error('TTS timeout after 45s');
      return res.status(504).json({ error: 'Narration took too long. Please try again.' });
    }
    console.error('TTS error:', err.message);
    res.status(500).json({ error: err.message || 'TTS unavailable' });
  }
});

module.exports = router;

