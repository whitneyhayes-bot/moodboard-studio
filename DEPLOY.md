# Moodboard Studio — Deployment Guide

Everything you need to go from these files to a live website.
Estimated time: 20–30 minutes.

---

## What you need before starting

- A computer (Mac, Windows, or Linux)
- An internet connection
- An email address

You do NOT need any coding experience to follow these steps.

---

## Step 1 — Install Node.js (if you don't have it)

Node.js is the software that runs the app on your computer for testing.

1. Go to https://nodejs.org
2. Click the big green button that says "LTS" (recommended)
3. Download and run the installer
4. When it finishes, open Terminal (Mac) or Command Prompt (Windows)
5. Type this and press Enter to confirm it worked:
   ```
   node --version
   ```
   You should see something like `v20.11.0`

---

## Step 2 — Get your Anthropic API key

This is what powers the AI vision analysis.

1. Go to https://console.anthropic.com
2. Sign up for a free account (or log in)
3. Click "API Keys" in the left sidebar
4. Click "Create Key"
5. Copy the key — it starts with `sk-ant-...`
6. **Save it somewhere safe** — you can only see it once

> Note: Anthropic gives new accounts free credits to start. The vision
> analysis uses Claude claude-opus-4-5 which costs about $0.01–0.03 per analysis
> depending on image sizes. Very affordable.

---

## Step 3 — Set up the project files

1. Download or unzip this project folder somewhere on your computer
   (e.g. your Desktop or Documents)

2. Open Terminal (Mac) or Command Prompt (Windows)

3. Navigate to the folder. For example, if it's on your Desktop:
   ```
   cd ~/Desktop/moodboard-studio
   ```
   On Windows:
   ```
   cd C:\Users\YourName\Desktop\moodboard-studio
   ```

4. Create your environment file by copying the example:
   ```
   cp .env.local.example .env.local
   ```
   On Windows:
   ```
   copy .env.local.example .env.local
   ```

5. Open `.env.local` in any text editor (Notepad is fine) and replace
   `your_api_key_here` with your actual Anthropic API key:
   ```
   ANTHROPIC_API_KEY=sk-ant-your-actual-key-here
   ```
   Save and close the file.

6. Install the project dependencies:
   ```
   npm install
   ```
   This downloads everything the app needs. Takes 1–2 minutes.

---

## Step 4 — Test it on your computer

1. Start the app locally:
   ```
   npm run dev
   ```

2. Open your browser and go to:
   ```
   http://localhost:3000
   ```

3. You should see Moodboard Studio! Try adding some images and
   clicking "Synthesize board" to confirm the AI analysis works.

4. When you're done testing, press Ctrl+C in the terminal to stop it.

---

## Step 5 — Put it on GitHub

GitHub stores your code so Vercel can deploy it.

1. Go to https://github.com and sign up for a free account

2. Once logged in, click the "+" icon (top right) → "New repository"

3. Name it `moodboard-studio`

4. Leave it set to "Public" (required for free Vercel hosting)

5. Click "Create repository"

6. GitHub will show you a page with commands. In your terminal
   (still in the moodboard-studio folder), run these one at a time:
   ```
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/YOUR-USERNAME/moodboard-studio.git
   git push -u origin main
   ```
   Replace `YOUR-USERNAME` with your actual GitHub username.

7. Refresh the GitHub page — you should see all your files there.

---

## Step 6 — Deploy to Vercel (your live website)

Vercel hosts your app for free and gives you a public URL.

1. Go to https://vercel.com and click "Sign Up"

2. Choose "Continue with GitHub" and authorize it

3. Click "Add New Project"

4. Find `moodboard-studio` in the list and click "Import"

5. On the next screen, expand "Environment Variables"

6. Add your API key:
   - Name: `ANTHROPIC_API_KEY`
   - Value: paste your `sk-ant-...` key

7. Click "Deploy"

8. Wait about 60 seconds. Vercel will show a confetti screen 🎉

9. Click "Continue to Dashboard" — you'll see your live URL,
   something like `moodboard-studio-yourname.vercel.app`

That's it. Your app is live and anyone can use it at that URL.

---

## Step 7 — Custom domain (optional)

If you want a proper URL like `moodboardstudio.com`:

1. Buy a domain at https://namecheap.com or https://domains.google.com
   (costs about $10–15/year)

2. In Vercel, go to your project → Settings → Domains

3. Click "Add Domain" and type your domain name

4. Follow Vercel's instructions to point your domain at Vercel
   (takes about 5–10 minutes to go live)

---

## Updating your app later

Whenever you make changes to the code and want them to go live:

```
git add .
git commit -m "Describe what you changed"
git push
```

Vercel automatically detects the push and redeploys in about 30 seconds.

---

## Troubleshooting

**"npm: command not found"**
→ Node.js isn't installed. Go back to Step 1.

**App loads but "Synthesize board" shows an error**
→ Check your `.env.local` file. Make sure there are no spaces
  around the `=` sign and the key starts with `sk-ant-`.

**Images from URLs don't load**
→ Some sites block external image loading. Try using the
  Upload tab instead, or use Unsplash URLs (they work reliably).

**Vercel deployment fails**
→ Check the error log in Vercel's dashboard. Usually it's a
  missing environment variable — confirm `ANTHROPIC_API_KEY` is set.

**"Failed to fetch" on Vercel but works locally**
→ You forgot to add the environment variable in Vercel's dashboard.
  Go to Project → Settings → Environment Variables and add it there.

---

## What's next (future ideas)

Once your app is live and working, here are natural next steps:

- **Save boards** — add a database (Supabase is free to start) so
  users can save and reload their boards
- **Share links** — generate a unique URL for each board
- **Export** — let users download their board as a PDF or image
- **User accounts** — let people log in and manage multiple boards
- **Paid tier** — charge for unlimited analyses using Stripe

Come back to Claude and ask for help building any of these!

---

Made with Moodboard Studio + Claude
