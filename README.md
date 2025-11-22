# LifeOS

Personal AI-powered productivity hub built with React, Vite, Tailwind, Dexie/Supabase, and Google integrations.

## Local Development
- Prereqs: Node 18+, npm.
- Install: `npm install`
- Env: copy `.env.local` from examples below and fill with your keys.
- Run: `npm run dev`
- Build: `npm run build`

### Required Environment Variables
Create `.env.local` with:
```
VITE_GEMINI_API_KEY=your_gemini_key
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_GOOGLE_CLIENT_ID=your_oauth_client_id
VITE_GOOGLE_CLIENT_SECRET=your_oauth_client_secret
```

## Deploying to Vercel
1) Push the repo to GitHub/GitLab/Bitbucket.  
2) In Vercel, “Add New Project” → import the repo.  
3) Framework preset: **Vite**. Build command `npm run build`; output directory `dist`.  
4) Add the env vars above in **Project Settings → Environment Variables** (Production + Preview + Development).  
5) Save & Deploy. Vercel will install dependencies, build, and host the app.  
6) If you change env vars later, redeploy from Vercel to apply.

### Custom Domain
- Add a domain in Vercel → assign to the project → update DNS as instructed → redeploy if prompted.

## Optional: Firebase (legacy/alternative)
If you switch to Firebase for auth/analytics:
- Create a Firebase project and enable the providers you need (e.g., Google).
- Grab the web app config from **Project Settings → General → Your apps** and map to `FIREBASE_API_KEY`, `FIREBASE_AUTH_DOMAIN`, `FIREBASE_PROJECT_ID`, `FIREBASE_STORAGE_BUCKET`, `FIREBASE_MESSAGING_SENDER_ID`, `FIREBASE_APP_ID`, `FIREBASE_MEASUREMENT_ID` (if using Analytics).
- For server-side access, use a service-account JSON file and load it via a secure secret path or env var — no email/password secrets required.

## Notes
- Supabase is the default backend; swapping to Firebase requires implementing the same storage interface used in `src/lib/storage.ts`.
- Google Calendar sync requires OAuth credentials and correct redirect URIs per your hosting domain (add the Vercel domain to the OAuth client).
