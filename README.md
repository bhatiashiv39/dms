# Chaiholic — website

A frontend + backend demo site for Chaiholic (Model Town, Rohtak): plain HTML/CSS/JS
with login/signup, table reservations, a general contact form, and a separate
inquiry form (catering, events, franchise), all backed by Supabase.

## Files

| File | Purpose |
|---|---|
| `index.html` | All page markup — hero, about, menu, reservation, map, contact, inquiry, auth modal |
| `style.css` | Full design system (colors, type, layout) |
| `script.js` | Supabase client, auth (signup/login/logout), form submissions |
| `supabase-schema.sql` | Database tables + row-level security policies |

## 1. Create the Supabase backend

1. Go to [supabase.com](https://supabase.com) → create a free project.
2. Open **SQL Editor** → paste the contents of `supabase-schema.sql` → **Run**.
   This creates `profiles`, `reservations`, and `inquiries` tables with RLS enabled.
3. Go to **Authentication → Providers** and confirm **Email** is enabled.
   For a demo/testing phase you can turn off "Confirm email" under
   **Authentication → Settings** so new signups can log in immediately.
4. Go to **Project Settings → API** and copy:
   - **Project URL**
   - **anon public** key

## 2. Connect the frontend

Open `script.js` and replace the two placeholders at the top:

```js
const SUPABASE_URL = "https://YOUR-PROJECT-REF.supabase.co";
const SUPABASE_ANON_KEY = "YOUR-SUPABASE-ANON-KEY";
```

That's the only code change needed — no build step, no bundler.

## 3. Try it locally

Any static server works, e.g.:

```bash
npx serve .
```

Then open the printed local URL.

## 4. Push to GitHub

```bash
git init
git add .
git commit -m "Chaiholic website"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/chaiholic-website.git
git push -u origin main
```

## 5. Deploy

Any static host works since there's no backend server to run (Supabase *is* the backend):

- **GitHub Pages**: repo → Settings → Pages → deploy from `main` branch.
- **Netlify / Vercel**: import the GitHub repo, no build command needed, publish directory `/`.

## What's editable without touching code

- **Menu items & prices** — currently hard-coded in `index.html` under `<section class="menu">`
  as placeholder values. Swap them for the real menu, or move them into a Supabase
  `menu_items` table later if you want the owner to edit prices without a developer.
- **Phone number / address / hours** — in the "Visit" section of `index.html`
  and the footer. Current contact number shown: **+91 70155 54930**.

## Data the owner can see

- **Reservations** and **Inquiries** land in their own Supabase tables.
- Row-level security is on: a signed-in customer can only see their *own* rows.
- The cafe owner reviews everything from the **Supabase Table Editor** (this uses
  the project's admin access and bypasses RLS), or you can add a "staff" role later —
  see the commented-out policy at the bottom of `supabase-schema.sql`.

## Notes

- This is a demo build, not Chaiholic's official site — menu prices are placeholders
  and should be replaced with the owner's real prices before going live.
- The map embed searches "Chaiholic Model Town Rohtak" on Google Maps — no API key
  needed for the basic embed used here.
