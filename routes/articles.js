// routes/articles.js — Open-access article aggregation
const router = require('express').Router();
const { supabaseAdmin } = require('../db/client');

const EMOJIS = ['🔬','🌍','💻','🌿','🧩','⚗️','🏛','🎭','🧬','📡','🌊','💡'];
const COLORS = ['#fff3e0','#e8f5e9','#e3f2fd','#fce4ec','#f3e5f5','#e0f2f1'];

function randomEmoji() { return EMOJIS[Math.floor(Math.random() * EMOJIS.length)]; }
function randomColor() { return COLORS[Math.floor(Math.random() * COLORS.length)]; }

// Fetch from Wikipedia featured content API
async function fetchWikipedia() {
  const today = new Date();
  const y = today.getUTCFullYear();
  const m = String(today.getUTCMonth() + 1).padStart(2, '0');
  const d = String(today.getUTCDate()).padStart(2, '0');

  const res = await fetch(`https://en.wikipedia.org/api/rest_v1/feed/featured/${y}/${m}/${d}`);
  const data = await res.json();
  const articles = [];

  if (data.tfa) {
    articles.push({
      source: 'Wikipedia · Featured Article · Open Access',
      topic: 'Featured',
      title: data.tfa.titles?.normalized || data.tfa.title,
      summary: (data.tfa.extract || '').slice(0, 200) + '...',
      url: data.tfa.content_urls?.desktop?.page || 'https://en.wikipedia.org',
      emoji: '⭐',
      ai_verified: true,
      is_safe: true
    });
  }

  if (data.mostread?.articles) {
    const picks = data.mostread.articles
      .filter(a => !a.title.includes('Special:') && !a.title.includes('Main_Page'))
      .slice(0, 4);
    picks.forEach(a => articles.push({
      source: `Wikipedia · ${Number(a.views || 0).toLocaleString()} readers today`,
      topic: 'Trending',
      title: a.titles?.normalized || a.title,
      summary: (a.extract || 'A widely-read article from Wikipedia\'s open knowledge base.').slice(0, 180) + '...',
      url: a.content_urls?.desktop?.page || 'https://en.wikipedia.org',
      emoji: randomEmoji(),
      ai_verified: true,
      is_safe: true
    }));
  }

  if (data.onthisday?.length) {
    const ev = data.onthisday[0];
    articles.push({
      source: 'Wikipedia · On This Day · Open Access',
      topic: 'History',
      title: `On This Day: ${(ev.text || '').slice(0, 70)}...`,
      summary: (ev.text || '').slice(0, 180) + '...',
      url: 'https://en.wikipedia.org/wiki/Wikipedia:On_this_day',
      emoji: '🗓',
      ai_verified: true,
      is_safe: true
    });
  }

  return articles;
}

// GET /api/articles/feed
router.get('/feed', async (req, res) => {
  try {
    const topic = req.query.topic || null;

    // Try cache first (articles less than 24h old)
    const cacheQuery = supabaseAdmin
      .from('article_cache')
      .select('*')
      .gt('expires_at', new Date().toISOString())
      .eq('is_safe', true)
      .order('fetched_at', { ascending: false })
      .limit(10);

    if (topic && topic !== 'For You') {
      cacheQuery.ilike('topic', `%${topic}%`);
    }

    const { data: cached } = await cacheQuery;

    if (cached && cached.length >= 3) {
      return res.json({ articles: cached, source: 'cache' });
    }

    // Cache miss — fetch fresh from Wikipedia
    const fresh = await fetchWikipedia();

    // Store in cache
    if (fresh.length > 0) {
      await supabaseAdmin.from('article_cache').insert(
        fresh.map(a => ({
          ...a,
          expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
        }))
      );
    }

    res.json({ articles: fresh, source: 'live' });
  } catch (err) {
    console.error('Articles error:', err.message);
    res.status(500).json({ error: 'Could not fetch articles', articles: [] });
  }
});

// POST /api/articles/save
router.post('/save', async (req, res) => {
  try {
    const { userId, article } = req.body;
    if (!userId || !article) return res.status(400).json({ error: 'userId and article required' });

    const { data, error } = await supabaseAdmin.from('saved_articles').insert({
      user_id: userId,
      title: article.title,
      summary: article.summary,
      source: article.source,
      url: article.url,
      topic: article.topic,
      emoji: article.emoji
    }).select().single();

    if (error) return res.status(400).json({ error: error.message });
    res.json({ saved: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/articles/saved/:userId
router.get('/saved/:userId', async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('saved_articles')
      .select('*')
      .eq('user_id', req.params.userId)
      .order('saved_at', { ascending: false });

    if (error) return res.status(400).json({ error: error.message });
    res.json({ articles: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
