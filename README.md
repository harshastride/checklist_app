# Stint Interview Ready Check

Candidates open one page before an interview and get a pass / fix verdict on:
internet speed, laptop performance, microphone, speaker, and (via Gemini) lighting, dressing, grooming, background, framing and posture from a single webcam photo.

## Run it

```bash
npm install
cp .env.example .env      # paste your Gemini key from https://aistudio.google.com/apikey
npm start                 # http://localhost:3000
```

Camera and mic need HTTPS or localhost. For candidates, put it behind HTTPS (Render, Railway, a VPS with Caddy/nginx, or `check.stint.academy`).

## How the AI review works

`public/index.html` captures one 640×480 JPEG from the webcam and POSTs it to `/api/review`.
`server.js` sends it to Gemini (`GEMINI_MODEL`, default `gemini-2.5-flash`) with a fixed rubric and asks for JSON:

```json
{"overall":"pass","score":8,"areas":{"attire":{"rating":"pass","note":"..."},"grooming":{},"background":{},"framing":{},"lighting":{},"posture":{}},"feedback":["..."]}
```

The key never reaches the browser. Photos are not stored.

To change what counts as pass / warn / fail, edit `REVIEW_PROMPT` in `server.js`.

## Files

- `server.js` — Express server + Gemini proxy
- `public/index.html` — the whole front end (no build step)
- `.env.example` — config template
