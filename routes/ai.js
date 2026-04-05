// routes/ai.js
const router = require('express').Router();
const Anthropic = require('@anthropic-ai/sdk');

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const MODEL = 'claude-sonnet-4-20250514';

const DEFAULT_SYSTEM = `You are KnowFlow's AI knowledge assistant. Keep answers informative, educational, clean, and appropriate for all ages. Never produce harmful content.`;

// POST /api/ai/chat — main endpoint for all AI calls
router.post('/chat', async (req, res) => {
  try {
    const { messages, system } = req.body;
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Messages array required' });
    }

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', '*');

    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 1000,
      system: system || DEFAULT_SYSTEM,
      messages,
      stream: true
    });

    for await (const event of response) {
      if (event.type === 'content_block_delta' && event.delta?.type === 'text_delta') {
        res.write(`data: ${JSON.stringify({ text: event.delta.text })}\n\n`);
      }
    }

    res.write('data: [DONE]\n\n');
    res.end();

  } catch (err) {
    console.error('AI chat error:', err.message);
    if (!res.headersSent) {
      res.status(500).json({ error: err.message });
    } else {
      res.write(`data: ${JSON.stringify({ text: '\n\nError: ' + err.message })}\n\n`);
      res.write('data: [DONE]\n\n');
      res.end();
    }
  }
});

// POST /api/ai/generate-plan — non-streaming plan generation
router.post('/generate-plan', async (req, res) => {
  try {
    const { score, gaps, selfRating, dailyTime } = req.body;

    const system = `You are KnowFlow's AI learning coach. Output ONLY valid JSON, no markdown:
{"headline":"2 words","summary":"2 sentences","gaps":[{"domain":"Name","icon":"emoji","level":"Beginner","desc":"1 sentence"}],"weeks":[{"num":1,"focus":"Theme","days":[{"day":"Mon","task":"Task","dur":"10 min","color":"#color"}]}]}
Include 3 gaps and 4 weeks with 5 days each.`;

    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 1000,
      system,
      messages: [{ role: 'user', content: `Score: ${score}%. Gaps: ${(gaps||[]).join(', ')}. Rating: ${selfRating}. Time: ${dailyTime}.` }]
    });

    const raw = response.content[0].text.replace(/```json|```/g, '').trim();
    const plan = JSON.parse(raw);
    res.json({ plan });

  } catch (err) {
    console.error('Generate plan error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
