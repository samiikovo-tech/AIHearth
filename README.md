# NEONHEART (AIHearth)

This repository contains a Progressive Web App (PWA) + simple Express proxy to integrate with OpenAI's Chat Completions API. It is prepared to be wrapped as a mobile app using Capacitor. This feature branch (feature/mobile-chatgpt) adds mobile scaffolding, moderation and image generation endpoints, and client settings to support user-provided OpenAI keys.

Quick start (local)

1. Install dependencies

   npm install

2. Copy env example and add your OpenAI key (optional for server proxy):

   cp .env.example .env
   # edit .env and set OPENAI_API_KEY=sk-...

3. Start server

   npm start

4. Open http://localhost:3000

Using user-supplied API key in the app (insecure for public builds)

- The app supports two modes:
  - Server proxy: client calls /api/chat on the server; server uses OPENAI_API_KEY from .env (recommended)
  - Local key: user pastes their OpenAI API key in Settings; the client will call OpenAI directly. This is less secure — do not distribute builds with embedded keys.

Mobile (Capacitor)

1. Install Capacitor CLI & core (dev deps):

   npm i @capacitor/core @capacitor/cli --save-dev

2. Initialize Capacitor (example AppId):

   npx cap init "NEONHEART" com.samiikovo.aihearth

3. Add Android / iOS:

   npx cap add android
   npx cap add ios

4. After building front-end, copy assets:

   npx cap copy
   npx cap open android
   npx cap open ios

Security & moderation

- The server provides /api/moderation and performs moderation before forwarding user messages or image prompts to OpenAI. You should keep moderation enabled in production.
- NEVER commit your OpenAI API key to the repo. Use environment variables or secret management in your hosting provider.
