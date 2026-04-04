// db/setup.js
// Run with: node db/setup.js
// This creates all KnowFlow tables in your Supabase database

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY // needs service key for table creation
);

const SQL = `
-- ─────────────────────────────────────────────
-- KnowFlow Database Schema
-- Maxwell Entities LLC
-- ─────────────────────────────────────────────

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ── USERS ────────────────────────────────────
create table if not exists users (
  id uuid primary key default uuid_generate_v4(),
  email text unique not null,
  name text,
  avatar_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  -- preferences
  daily_time_minutes integer default 15,
  self_rating text default 'Intermediate',
  preferred_topics text[] default '{}',
  notifications_enabled boolean default true,
  family_safe_mode boolean default false,
  -- streak tracking
  streak_days integer default 0,
  last_active_date date,
  total_articles_read integer default 0
);

-- ── KNOWLEDGE ASSESSMENTS ─────────────────────
create table if not exists assessments (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references users(id) on delete cascade,
  completed_at timestamptz default now(),
  score_pct integer not null,
  correct_count integer not null,
  total_questions integer not null,
  self_rating text,
  daily_time text,
  gap_domains text[] default '{}',
  raw_results jsonb default '{}'
);

-- ── LEARNING PLANS ────────────────────────────
create table if not exists learning_plans (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references users(id) on delete cascade,
  assessment_id uuid references assessments(id),
  created_at timestamptz default now(),
  is_active boolean default true,
  headline text,
  summary text,
  weeks jsonb default '[]',
  gaps jsonb default '[]'
);

-- ── SAVED ARTICLES ────────────────────────────
create table if not exists saved_articles (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references users(id) on delete cascade,
  saved_at timestamptz default now(),
  title text not null,
  summary text,
  source text,
  url text,
  topic text,
  emoji text
);

-- ── ARTICLE CACHE (from open APIs) ───────────
create table if not exists article_cache (
  id uuid primary key default uuid_generate_v4(),
  fetched_at timestamptz default now(),
  expires_at timestamptz default now() + interval '24 hours',
  source text not null,
  topic text,
  title text not null,
  summary text,
  url text,
  emoji text,
  ai_verified boolean default false,
  is_safe boolean default true
);

-- ── AD CAMPAIGNS ──────────────────────────────
create table if not exists ad_campaigns (
  id uuid primary key default uuid_generate_v4(),
  created_at timestamptz default now(),
  advertiser_name text not null,
  advertiser_email text not null,
  company text,
  website text,
  package_type text, -- 'Spark', 'Growth', 'Prestige'
  budget_range text,
  campaign_goals text,
  status text default 'pending', -- pending, active, paused, completed
  start_date date,
  end_date date,
  total_budget_usd numeric(10,2),
  spent_usd numeric(10,2) default 0,
  target_topics text[] default '{}'
);

-- ── AD IMPRESSIONS ────────────────────────────
create table if not exists ad_impressions (
  id uuid primary key default uuid_generate_v4(),
  campaign_id uuid references ad_campaigns(id),
  recorded_at timestamptz default now(),
  topic text,
  user_region text
);

-- ── CHAT HISTORY ──────────────────────────────
create table if not exists chat_sessions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references users(id) on delete cascade,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  messages jsonb default '[]'
);

-- ── INDEXES for performance ───────────────────
create index if not exists idx_assessments_user on assessments(user_id);
create index if not exists idx_learning_plans_user on learning_plans(user_id);
create index if not exists idx_saved_articles_user on saved_articles(user_id);
create index if not exists idx_article_cache_expires on article_cache(expires_at);
create index if not exists idx_article_cache_topic on article_cache(topic);
create index if not exists idx_ad_impressions_campaign on ad_impressions(campaign_id);
create index if not exists idx_chat_sessions_user on chat_sessions(user_id);

-- ── ROW LEVEL SECURITY ────────────────────────
alter table users enable row level security;
alter table assessments enable row level security;
alter table learning_plans enable row level security;
alter table saved_articles enable row level security;
alter table chat_sessions enable row level security;

-- Users can only read/edit their own data
create policy if not exists "users_own_data" on users
  for all using (auth.uid() = id);

create policy if not exists "assessments_own_data" on assessments
  for all using (auth.uid() = user_id);

create policy if not exists "learning_plans_own_data" on learning_plans
  for all using (auth.uid() = user_id);

create policy if not exists "saved_articles_own_data" on saved_articles
  for all using (auth.uid() = user_id);

create policy if not exists "chat_sessions_own_data" on chat_sessions
  for all using (auth.uid() = user_id);

-- Article cache is public read
alter table article_cache enable row level security;
create policy if not exists "article_cache_public_read" on article_cache
  for select using (true);

-- Ad campaigns are private (service role only from backend)
alter table ad_campaigns enable row level security;
alter table ad_impressions enable row level security;
`;

async function setupDatabase() {
  console.log('🚀 Setting up KnowFlow database...');
  console.log('📡 Connecting to:', process.env.SUPABASE_URL);

  const { error } = await supabase.rpc('exec_sql', { sql: SQL }).catch(() => ({ error: { message: 'RPC not available — use SQL editor' } }));

  if (error) {
    console.log('\n📋 Automatic setup not available via RPC.');
    console.log('👉 Please run the SQL manually:\n');
    console.log('1. Go to your Supabase dashboard');
    console.log('2. Click "SQL Editor" in the left sidebar');
    console.log('3. Click "New query"');
    console.log('4. Paste and run the SQL from db/schema.sql\n');
    
    // Write the SQL to a file for easy copy-paste
    const fs = require('fs');
    fs.writeFileSync('./db/schema.sql', SQL);
    console.log('✅ SQL saved to db/schema.sql — copy and paste it into Supabase SQL Editor');
  } else {
    console.log('✅ Database tables created successfully!');
  }
}

setupDatabase();
