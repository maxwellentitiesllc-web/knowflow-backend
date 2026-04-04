// routes/ads.js
const router = require('express').Router();
const { supabaseAdmin } = require('../db/client');

// POST /api/ads/enquiry — save advertiser contact form
router.post('/enquiry', async (req, res) => {
  try {
    const { company, name, email, website, packageType, budgetRange, goals } = req.body;
    if (!email || !company) return res.status(400).json({ error: 'Company and email required' });

    const { data, error } = await supabaseAdmin
      .from('ad_campaigns')
      .insert({
        advertiser_name: name || company,
        advertiser_email: email,
        company,
        website,
        package_type: packageType,
        budget_range: budgetRange,
        campaign_goals: goals,
        status: 'pending'
      })
      .select().single();

    if (error) return res.status(400).json({ error: error.message });

    res.json({
      message: 'Enquiry received! Our team will be in touch within 24 hours.',
      id: data.id
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/ads/campaigns — admin: list all campaigns (service key required)
router.get('/campaigns', async (req, res) => {
  try {
    const adminKey = req.headers['x-admin-key'];
    if (adminKey !== process.env.SUPABASE_SERVICE_KEY) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const { data, error } = await supabaseAdmin
      .from('ad_campaigns')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) return res.status(400).json({ error: error.message });
    res.json({ campaigns: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/ads/impression — record an ad impression
router.post('/impression', async (req, res) => {
  try {
    const { campaignId, topic, userRegion } = req.body;
    if (!campaignId) return res.status(400).json({ error: 'campaignId required' });

    await supabaseAdmin.from('ad_impressions').insert({
      campaign_id: campaignId,
      topic,
      user_region: userRegion
    });

    res.json({ recorded: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
