/*
  GET /api/explain              → { enabled: true|false }
  GET /api/explain?qid=b7&chosen=2 → { text: "..." }

  Optional. Needs ANTHROPIC_API_KEY set in your Vercel project's
  environment variables. Without it, the site works normally and the
  "Explain it another way" button simply doesn't appear.

  The prompt is built here from the question bank, so this endpoint
  can only explain this site's quiz questions. Responses are cached at
  Vercel's edge, so each (question, wrong answer) pair is generated
  once and then shared by everyone who makes the same mistake.
*/
import { QBYID } from "../src/data.js";

const MODEL = process.env.ANTHROPIC_MODEL || "claude-haiku-5-5";

export default async function handler(req, res) {
  const key = process.env.ANTHROPIC_API_KEY;

  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Use GET." });
  }

  const { qid, chosen } = req.query || {};

  // Status check used by the website to decide whether to show the button.
  if (qid === undefined) {
    res.setHeader("Cache-Control", "public, s-maxage=60");
    return res.status(200).json({ enabled: Boolean(key) });
  }

  if (!key) return res.status(503).json({ error: "Explanations aren't set up on this site." });

  const q = QBYID[String(qid)];
  const pick = Number(chosen);
  if (!q || !Number.isInteger(pick) || pick < 0 || pick >= q.o.length || pick === q.a) {
    return res.status(400).json({ error: "Unknown question or answer." });
  }

  const prompt = `A student who started this intro astronomy course ("Stars") with zero background just answered a multiple-choice question incorrectly.

Question: ${q.q}
Options:
${q.o.map((o, i) => `${i + 1}. ${o}`).join("\n")}
They chose: ${q.o[pick]}
Correct answer: ${q.o[q.a]}
Explanation they already saw: ${q.why}

Explain it a different way in under 120 words. Start from something they know from everyday life, use one concrete analogy or worked number, and say why their choice was tempting but wrong. Plain text only: no headers, no lists, no markdown.`;

  try {
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": key,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({ model: MODEL, max_tokens: 400, messages: [{ role: "user", content: prompt }] }),
    });
    const data = await r.json();
    if (!r.ok) {
      console.error("Anthropic API error", r.status, data);
      return res.status(502).json({ error: "The explanation service returned an error." });
    }
    const text = (data.content || []).filter((b) => b.type === "text").map((b) => b.text).join("\n").trim();
    if (!text) return res.status(502).json({ error: "The explanation came back empty." });

    // Cache at the edge for a week; serve stale while refreshing for a day.
    res.setHeader("Cache-Control", "public, s-maxage=604800, stale-while-revalidate=86400");
    return res.status(200).json({ text });
  } catch (e) {
    console.error(e);
    return res.status(502).json({ error: "Couldn't reach the explanation service." });
  }
}
