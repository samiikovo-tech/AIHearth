# NEONHEART (AIHearth)

This repository contains a Progressive Web App (PWA) + simple Express proxy to integrate with OpenAI's Chat Completions API. It is prepared to be wrapped as a mobile app using Capacitor.

Getting started (local):

1. Install dependencies

   npm install

2. Create `.env` file in repo root with your OpenAI key:

   OPENAI_API_KEY=sk-...

3. Start server

   npm start

Open http://localhost:3000 in your browser. You can install as PWA on mobile or wrap with Capacitor for native builds.

Capacitor (optional):

- Install Capacitor and add platforms: `npm i @capacitor/core @capacitor/cli` then `npx cap init` and `npx cap add android`.

Security:

- Do NOT commit your API key. Use environment variables or host the proxy on a secure server (Vercel/Render/Cloud Run).

