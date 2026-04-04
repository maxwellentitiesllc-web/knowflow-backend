// routes/ai.js — All Claude AI endpoints
const router = require('express').Router();
const Anthropic = require('@anthropic-ai/sdk');

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const MODEL = 'claude-sonnet-4-20250514';

// Helper: stream Claude response to client
async function streamClaude(res, messages, system) {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  const stream = anthropic.messages.stream({
    model: MODEL,
    max_tokens: 1000,
    system,
    messages
  });

  for await (const chunk of stream) {
    if (chunk.type === 'content_block_delta' && chunk.delta?.text) {
      res.write(`data: ${JSON.stringify({ text: chunk.delta.text })}\n\n`);
    }
  }
  res.write('data: [DONE]\n\n');
  res.end();
}

// POST /api/ai/digest — Daily AI digest
router.post('/digest', async (req, res) => {
  try {
    const today = new Date().toLocaleDateString('en-US', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });
    const system = `You are KnowFlow's AI editor. Write 2–3 sentences of a daily knowledge digest for a global free-knowledge app. Be specific, intellectually curious. Focus on science, world affairs, culture, and ideas. Never mention harmful content. End with exactly: TOPICS:["Topic1","Topic2","Topic3","Topic4","Topic5"]`;

    await streamClaude(res,
      [{ role: 'user', content: `Generate today's KnowFlow digest for ${today}.` }],
      system
    );
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/ai/search — AI-powered knowledge search
router.post('/search', async (req, res) => {
  try {
    const { query } = req.body;
    if (!query) return res.status(400).json({ error: 'Query is required' });

    const system = `You are KnowFlow's AI search engine. Write a 3-paragraph factual educational answer drawing on global open-access knowledge. Reference real publications/institutions as [Name · Country]. No violence, nudity or harmful content. End with: SOURCES:["Source · Country","Source · Country","Source · Country"]`;

    await streamClaude(res,
      [{ role: 'user', content: `Search query: "${query}" — educational answer from open-access global knowledge.` }],
      system
    );
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/ai/chat — Conversational AI
router.post('/chat', async (req, res) => {
  try {
    const { messages } = req.body;
    if (!messages || !Array.isArray(messages)) return res.status(400).json({ error: 'Messages array required' });

    const system = `You are KnowFlow's AI knowledge assistant. Keep answers 2–3 paragraphs, informative, educational, clean, and appropriate for all ages. Reference real open-access journals or institutions when helpful. Never produce harmful content.`;

    await streamClaude(res, messages, system);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/ai/generate-plan — Generate learning plan from assessment
router.post('/generate-plan', async (req, res) => {
  try {
    const { score, gaps, selfRating, dailyTime } = req.body;

    const system = `You are KnowFlow's AI learning coach. Analyse a user's knowledge assessment and output a JSON learning plan.
Respond ONLY with valid JSON, no markdown, no extra text.
The JSON must have this exact structure:
{
  "headline": "2-word description e.g. Curious Explorer",
  "summary": "2 sentence personalised summary",
  "gaps": [{"domain":"Name","icon":"emoji","level":"Beginner/Developing/Intermediate","desc":"1 sentence focus"}],
  "weeks": [{"num":1,"focus":"Theme","days":[{"day":"Mon","task":"Specific task using real open-access resources","dur":"10 min","color":"#hexcolor"}]}]
}
Include exactly 3 gap items and 4 weeks with 5 days each. Tasks must reference real resources (Wikipedia, arXiv, PubMed, Khan Academy, etc).`;

    const prompt = `Score: ${score}%. Gaps in: ${(gaps || []).join(', ') || 'multiple areas'}. Self-rating: ${selfRating || 'Intermediate'}. Daily time: ${dailyTime || '15 min'}. Build their personalised plan.`;

    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 1000,
      system,
      messages: [{ role: 'user', content: prompt }]
    });

    const raw = response.content[0].text.replace(/```json|```/g, '').trim();
    const plan = JSON.parse(raw);
    res.json({ plan });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/ai/filter-content — Check if content is safe
router.post('/filter-content', async (req, res) => {
  try {
    const { title, text } = req.body;
    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 100,
      system: 'You are a content safety checker. Reply ONLY with JSON: {"safe": true/false, "reason": "brief reason if unsafe"}',
      messages: [{ role: 'user', content: `Check this content for safety (violence, nudity, misinformation, harmful content):\nTitle: ${title}\nText: ${text?.slice(0, 500)}` }]
    });
    const result = JSON.parse(response.content[0].text);
    res.json(result);
  } catch (err) {
    res.json({ safe: true, reason: 'Filter check failed — defaulting to safe' });
  }
});

module.exports = router;
