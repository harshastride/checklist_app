// Stint Interview Ready Check — server
// Serves the web app and proxies one camera frame to Gemini for the visual review.
// The Gemini key stays here on the server; the browser never sees it.

require('dotenv').config();
const express = require('express');
const path = require('path');

const PORT = process.env.PORT || 3000;
const GEMINI_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

if (!GEMINI_KEY) {
  console.error('\nGEMINI_API_KEY is missing. Copy .env.example to .env and paste your key.\n');
  process.exit(1);
}

const app = express();
app.use(express.json({ limit: '6mb' }));
app.use(express.static(path.join(__dirname, 'public')));

const REVIEW_PROMPT = `You are a placement coach at an Indian tech training institute, reviewing a candidate's webcam frame seconds before an online job interview (a video call with a recruiter at a company like Deloitte, Accenture or IBM). Judge ONLY what is visible. Be specific, kind and practical: one short sentence per note, plain English, no jargon.

Rate each area as "pass", "warn" or "fail":
- attire: collared formal or smart-casual top = pass; plain t-shirt or casual kurta = warn; hoodie, vest, sleeveless, nightwear, loud prints or big logos = fail.
- grooming: hair neat, face clean or beard tidy = pass; slightly untidy = warn; clearly unkempt = fail.
- background: plain wall, curtain, bookshelf or tidy room = pass; busy but acceptable = warn; bed, clutter, hanging clothes, other people, kitchen or bathroom = fail.
- framing: head and shoulders centred, eyes in the upper third, camera at eye level = pass; too close, too far, off-centre or looking down at the camera = warn; face cut off or mostly out of frame = fail.
- lighting: face evenly lit and clear = pass; a little dark or lit from one side = warn; face dark, strong window backlight, or washed out = fail.
- posture: sitting upright and facing the camera = pass; slouching or leaning = warn; lying down or not facing the camera = fail.

If no person is clearly visible, set every area to "fail" and say so in feedback.

Reply with ONLY this JSON object and nothing else:
{"overall":"pass|warn|fail","score":0-10,"areas":{"attire":{"rating":"pass|warn|fail","note":"..."},"grooming":{"rating":"...","note":"..."},"background":{"rating":"...","note":"..."},"framing":{"rating":"...","note":"..."},"lighting":{"rating":"...","note":"..."},"posture":{"rating":"...","note":"..."}},"feedback":["most important fix first","second","third"]}
At most 3 feedback lines. If everything passes, give one line of encouragement.`;

app.post('/api/review', async (req, res) => {
  try {
    const { image } = req.body || {};
    if (!image || typeof image !== 'string') return res.status(400).json({ error: 'image (base64 JPEG) is required' });
    const data = image.replace(/^data:image\/\w+;base64,/, '');

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_KEY}`;
    const body = {
      contents: [{ role: 'user', parts: [{ text: REVIEW_PROMPT }, { inline_data: { mime_type: 'image/jpeg', data } }] }],
      generationConfig: { response_mime_type: 'application/json', temperature: 0.2 }
    };
    const r = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const j = await r.json();
    if (!r.ok) {
      console.error('Gemini error', r.status, JSON.stringify(j).slice(0, 500));
      return res.status(502).json({ error: (j.error && j.error.message) || 'Gemini request failed' });
    }
    const text = j.candidates?.[0]?.content?.parts?.map(p => p.text || '').join('') || '';
    let parsed;
    try { parsed = JSON.parse(text); }
    catch { const m = text.match(/\{[\s\S]*\}/); parsed = m ? JSON.parse(m[0]) : null; }
    if (!parsed || !parsed.areas) return res.status(502).json({ error: 'AI reply could not be read', raw: text.slice(0, 300) });
    res.json(parsed);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Server error during review' });
  }
});

app.get('/api/health', (_req, res) => res.json({ ok: true, model: GEMINI_MODEL }));

app.listen(PORT, () => console.log(`Interview Ready Check running at http://localhost:${PORT}  (model: ${GEMINI_MODEL})`));
