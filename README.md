# KnowFlow Backend — Setup Guide
### Maxwell Entities LLC · EIN: 99-2297947

This guide walks you through every step to get the backend running,
even if you've never done this before. Take it one step at a time.

---

## What you'll need
- A computer (Mac, Windows, or Linux)
- An internet connection
- About 30 minutes

---

## STEP 1 — Install Node.js (the engine that runs the server)

1. Go to **nodejs.org**
2. Click the big green **"LTS"** download button
3. Open the downloaded file and click through the installer
4. To check it worked, open **Terminal** (Mac) or **Command Prompt** (Windows)
   and type: `node --version`
   You should see something like `v20.0.0`

---

## STEP 2 — Download the backend files

You have two options:

**Option A — If you have Git installed:**
```bash
git clone <your-repo-url>
cd knowflow-backend
```

**Option B — Download the ZIP:**
1. Download the knowflow-backend folder
2. Unzip it somewhere easy to find (e.g. your Desktop)
3. Open Terminal / Command Prompt
4. Navigate to the folder:
   - Mac: `cd ~/Desktop/knowflow-backend`
   - Windows: `cd C:\Users\YourName\Desktop\knowflow-backend`

---

## STEP 3 — Install dependencies

In your Terminal, inside the knowflow-backend folder, run:

```bash
npm install
```

This downloads all the libraries the server needs. Takes about 1 minute.

---

## STEP 4 — Set up your environment variables (secrets)

1. Find the file called `.env.example` in the folder
2. Make a **copy** of it and rename the copy to `.env` (remove ".example")
3. Open `.env` in any text editor (Notepad, TextEdit, VS Code)
4. Fill in these values:

```
SUPABASE_URL=https://tjmvjodfbjgsfyerpahj.supabase.co
SUPABASE_ANON_KEY=sb_publishable_4yJkKb88OFuOdJfsScIn9A_YieiKQCQ
SUPABASE_SERVICE_KEY=<get this from Supabase → Settings → API → service_role>
ANTHROPIC_API_KEY=<get this from console.anthropic.com → API Keys>
JWT_SECRET=knowflow_maxwell_entities_2026_secret_key_change_this
```

**Where to get your Supabase service key:**
- Go to supabase.com → your knowflow project
- Click **Settings** (gear icon) in the left sidebar
- Click **API**
- Find **service_role** key — click the eye icon to reveal it
- Copy and paste it into your .env file

**Where to get your Anthropic API key:**
- Go to console.anthropic.com
- Sign in (or create a free account)
- Click **API Keys** in the left menu
- Click **Create Key**
- Copy it into your .env file

---

## STEP 5 — Set up your database tables

1. Go to **supabase.com** → your knowflow project
2. Click **SQL Editor** in the left sidebar
3. Click **New query**
4. Open the file `db/schema.sql` from your backend folder
5. Select all the text (Ctrl+A or Cmd+A) and copy it
6. Paste it into the Supabase SQL editor
7. Click **Run** (or press Ctrl+Enter)
8. You should see "Success. No rows returned" — that means it worked!

---

## STEP 6 — Start the server

In your Terminal, run:

```bash
npm run dev
```

You should see:
```
🚀 KnowFlow API running on http://localhost:3001
📡 Supabase: https://tjmvjodfbjgsfyerpahj.supabase.co
🌍 Environment: development
```

**Test it's working** — open your browser and go to:
http://localhost:3001/api/health

You should see JSON like: `{"status":"ok","database":"connected"}`

If you see that — your backend is running! 🎉

---

## STEP 7 — Deploy to the internet (Render.com — free)

To make your backend accessible from anywhere:

1. Go to **render.com** and sign up (free)
2. Click **New** → **Web Service**
3. Connect your GitHub account and select your knowflow-backend repo
   (or use "Deploy from existing code")
4. Fill in:
   - **Name:** knowflow-api
   - **Runtime:** Node
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
5. Click **Environment** and add all your `.env` variables
6. Click **Create Web Service**
7. Render gives you a URL like: `https://knowflow-api.onrender.com`

---

## API Endpoints Reference

Once running, your server provides these endpoints:

| Method | URL | What it does |
|--------|-----|--------------|
| GET | /api/health | Check server is running |
| POST | /api/auth/signup | Create new user account |
| POST | /api/auth/login | Log in, get token |
| GET | /api/articles/feed | Get articles from Wikipedia |
| POST | /api/articles/save | Save article for a user |
| POST | /api/ai/digest | Generate AI daily digest |
| POST | /api/ai/search | AI knowledge search |
| POST | /api/ai/chat | Conversational AI |
| POST | /api/ai/generate-plan | Create learning plan |
| POST | /api/assessment/submit | Save test results + plan |
| GET | /api/assessment/plan/:userId | Get user's active plan |
| POST | /api/ads/enquiry | Save advertiser contact |
| POST | /api/ads/impression | Record ad impression |

---

## Troubleshooting

**"Cannot find module" error:**
Run `npm install` again

**"Invalid API key" for Anthropic:**
Double-check your ANTHROPIC_API_KEY in .env — no spaces or quotes around it

**"Database error" on /api/health:**
Make sure you ran the schema.sql in Supabase, and your SUPABASE_SERVICE_KEY is correct

**Port already in use:**
Change PORT=3001 to PORT=3002 in your .env file

---

## Need help?
Contact: maxwellentitiesllc@gmail.com

*KnowFlow Backend — Built for Maxwell Entities LLC*
