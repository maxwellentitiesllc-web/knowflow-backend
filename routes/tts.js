// routes/tts.js — OpenAI Text-to-Speech for KnowFlow meditations
const router = require('express').Router();

// POST /api/tts
router.post('/', async (req, res) => {
  try {
    const { text, voice, speed } = req.body;
    if (!text) return res.status(400).json({ error: 'Text is required' });

    // Truncate to reasonable length (OpenAI TTS max is 4096 chars)
    const cleanText = text.slice(0, 4000);

    const response = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'tts-1',
        input: cleanText,
        voice: voice || 'nova',      // nova = warm, calm female — perfect for meditation
        speed: speed || 0.85,        // slightly slower for meditative pacing
        response_format: 'mp3'
      })
    });

    if (!response.ok) {
      const err = await response.json();
      return res.status(500).json({ error: err.error?.message || 'TTS failed' });
    }

    // Stream audio directly back to client
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Cache-Control', 'public, max-age=3600'); // cache 1hr
    res.setHeader('Access-Control-Allow-Origin', '*');

    const buffer = await response.arrayBuffer();
    res.send(Buffer.from(buffer));

  } catch (err) {
    console.error('TTS error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
