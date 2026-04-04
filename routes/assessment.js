// routes/assessment.js
const router = require('express').Router();
const { supabaseAdmin } = require('../db/client');

// POST /api/assessment/submit — save results + plan
router.post('/submit', async (req, res) => {
  try {
    const { userId, score, correctCount, totalQuestions,
            selfRating, dailyTime, gaps, plan } = req.body;

    // Save assessment result
    const { data: assessment, error: aErr } = await supabaseAdmin
      .from('assessments')
      .insert({
        user_id: userId || null,
        score_pct: score,
        correct_count: correctCount,
        total_questions: totalQuestions,
        self_rating: selfRating,
        daily_time: dailyTime,
        gap_domains: gaps || [],
        raw_results: req.body
      })
      .select().single();

    if (aErr) return res.status(400).json({ error: aErr.message });

    // Save learning plan if provided
    let savedPlan = null;
    if (plan && userId) {
      const { data: lp, error: lpErr } = await supabaseAdmin
        .from('learning_plans')
        .insert({
          user_id: userId,
          assessment_id: assessment.id,
          headline: plan.headline,
          summary: plan.summary,
          weeks: plan.weeks,
          gaps: plan.gaps,
          is_active: true
        })
        .select().single();

      if (!lpErr) savedPlan = lp;

      // Deactivate old plans
      await supabaseAdmin
        .from('learning_plans')
        .update({ is_active: false })
        .eq('user_id', userId)
        .neq('id', lp?.id);
    }

    res.json({ assessment, plan: savedPlan });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/assessment/plan/:userId — get active learning plan
router.get('/plan/:userId', async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('learning_plans')
      .select('*, assessments(*)')
      .eq('user_id', req.params.userId)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error) return res.status(404).json({ error: 'No active plan found' });
    res.json({ plan: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/assessment/history/:userId
router.get('/history/:userId', async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('assessments')
      .select('*')
      .eq('user_id', req.params.userId)
      .order('completed_at', { ascending: false });

    if (error) return res.status(400).json({ error: error.message });
    res.json({ assessments: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
