# Stars, Midterm 1: study guide

A study website for Stars (Autumn 2026), Midterm 1. It has 11 lessons built from Lessons 1–4, 122 practice questions that keep coming back until you've mastered them, a weak-spot tracker, and a 20-question exam simulation.

It's a plain static site (Vite + React). It works without any setup or API key.

## Deploy it on Vercel

### Option A: through GitHub (no command line)

1. Create a new repository on [github.com](https://github.com/new). It can be private.
2. On the empty repository page, click **uploading an existing file**. Drag in everything *inside* this folder (`index.html`, `package.json`, `vite.config.js`, and the `src`, `api`, and `public` folders), then click **Commit changes**.
3. Go to [vercel.com](https://vercel.com), sign in with GitHub, and click **Add New → Project**. Pick your repository and click **Import**.
4. Vercel detects that it's a Vite project. Leave the settings as they are and click **Deploy**.
5. After about a minute you get a link like `stars-midterm1.vercel.app`. Send that to your friends.

Whenever you change a file on GitHub, Vercel redeploys automatically.

### Option B: with the Vercel command line

You need [Node.js](https://nodejs.org) installed.

```bash
cd stars-midterm1
npm install
npx vercel          # first time: it asks you to log in and name the project
npx vercel --prod   # publishes to your main URL
```

## Run it on your own computer

```bash
npm install
npm run dev
```

Then open http://localhost:5173. (The "Explain it another way" button stays hidden in this mode. Use `npx vercel dev` instead if you want to test it locally.)

## Optional: turn on "Explain it another way"

When someone gets a question wrong, this button asks Claude for a fresh explanation. It needs an Anthropic API key, and **usage is billed to that key**.

1. Create an API key in your Anthropic (Claude) Console account.
2. In Vercel, open your project and go to **Settings → Environment Variables**. Add `ANTHROPIC_API_KEY` with your key as the value.
3. Redeploy so the key takes effect: **Deployments → ⋯ (on the latest one) → Redeploy**.

To use a different model, add `ANTHROPIC_MODEL` too (the default is `claude-haiku-5-5`).

How costs stay small:

- The server function builds its own prompt from the question bank, so it can only explain this site's quiz questions. Strangers can't use it as a free chatbot.
- Answers are cached at Vercel's edge for a week. Everyone who makes the same mistake gets the same cached explanation. There are only 355 possible question/wrong-answer pairs, so paid calls are capped by that rather than by how many people use the site. (The cache is per region and can occasionally refresh, so treat 355 a week as a rough ceiling, not a guarantee.)
- Set a spending limit for the key in your console as a safety net.

If you never add a key, the button simply doesn't appear and everything else works the same.

## Good to know

- **Progress is per person, per browser.** Each friend's answers save in their own browser (localStorage). Nothing is shared between people or synced between devices. Private browsing or clearing site data starts them fresh.
- **Anyone with the link can open the site.** Vercel URLs are public.
- **The countdown** in the header is set to Wednesday, October 14, 2026.
- **To fix or add questions,** edit `src/data.js`. Each question lists its options, the index of the correct one (`a`, counting from 0), an explanation (`why`), a hint (`h`), and optional feedback for specific wrong answers (`w`).

## What's in the folder

```
index.html          page shell, fonts, link-preview text
src/main.jsx        starts the app
src/App.jsx         lessons, practice engine, progress view, diagrams
src/data.js         all lesson text and the 122 questions
src/styles.css      styles
api/explain.js      optional server function for AI explanations
public/favicon.svg  site icon
```
