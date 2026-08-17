# Coffee Hub Lahore ☕

A warm, butter-yellow-and-cocoa-themed website for coffee lovers in Lahore. Browse cafes, see top-10
rankings, rate cafes by category, and keep a private list of the cafes you've tried.

**This version runs on PostgreSQL (hosted free on [Neon](https://neon.tech)) and deploys cleanly to
[Vercel](https://vercel.com).** No database server to install yourself, and no separate backend host —
Vercel runs the API as serverless functions and Neon holds the data.

## What's included

- **Backend:** Node.js + Express, talking to a Postgres database via Neon's serverless HTTP driver
  (`@neondatabase/serverless`) — the same driver works identically whether you're running locally or
  deployed on Vercel, so there's nothing special to configure for either environment.
- **Frontend:** Plain HTML/CSS/JS (no build step, no framework).
- **Admin-only:** Only an admin account can add cafes and drinks, or mark other users as "Creators."

## Features

- Home page with **Top 10 Cafes** (rank by overall rating or by a single category — Ambiance, Service,
  Food, or Drinks & Taste) and **Top 10 Drinks of the Month**, plus a searchable/filterable cafe list.
- Cafe detail pages with a description, drinks/flavours offered, a **category-based rating widget**
  (Ambiance, Service, Food, Drinks & Taste rated separately), and a filterable **Ratings Breakdown** panel.
- A separate **Creators' Reviews** section on every cafe page, featuring reviews from accounts the admin
  has marked as "Creators" — shown apart from regular **Community Reviews**.
- Comments are capped at **200 words**, and always show the reviewer's name.
- Anyone can browse without an account. Rating and commenting require signing up.
- Each signed-up user gets a **private dashboard** to mark cafes as "tried."
- An **Admin panel** with three tabs: add/remove cafes, add/remove drinks, and mark users as Creators.

---

## Part 1 — Set up your database (Neon)

1. Go to [neon.tech](https://neon.tech) and create a free account and a new project (pick a region close
   to you or your users).
2. On your project's dashboard, click **Connect** and copy the connection string. It looks like:
   ```
   postgresql://user:password@ep-xxxxx.region.aws.neon.tech/neondb?sslmode=require
   ```
3. Keep that string handy — you'll paste it into `.env` (for local use) and into Vercel's environment
   variables (for deployment) in the steps below.

## Part 2 — Run it on your computer

### Prerequisites

Install **Node.js 20 or newer**: https://nodejs.org (choose the LTS version). Check it worked:
```
node -v
npm -v
```

### Steps

1. Unzip the project folder anywhere on your computer.
2. Open a terminal in that folder and install dependencies:
   ```
   cd path/to/coffee-lahore
   npm install
   ```
3. Copy `.env.example` to a new file named `.env`, and fill in the values:
   ```
   DATABASE_URL=your-neon-connection-string-here
   JWT_SECRET=make_this_a_long_random_string
   ADMIN_EMAIL=your-email@example.com
   ADMIN_PASSWORD=choose-a-strong-password
   ```
4. Create the database tables (run this once, or again any time you reset the database):
   ```
   npm run migrate
   ```
5. Create your admin account and some sample data:
   ```
   npm run seed
   ```
   This prints your admin email/password to the terminal and adds a few sample Lahore cafes and drinks,
   plus a demo **Creator** account (`creator@coffeelahore.pk` / `creator12345`) with a sample review.
6. Start the website:
   ```
   npm start
   ```
   Open `http://localhost:3000` in your browser.
7. Log in with your admin credentials, click **Admin** in the nav, and add your real cafes/drinks. Mark
   any signed-up user as a Creator from the **Users** tab.

---

## Part 3 — Deploy to Vercel

1. Push this project to a GitHub (or GitLab/Bitbucket) repository.
2. Go to [vercel.com](https://vercel.com), sign in, and click **Add New → Project**, then import your
   repository.
3. Before deploying, open the **Environment Variables** section and add:
   | Name | Value |
   |---|---|
   | `DATABASE_URL` | your Neon connection string from Part 1 |
   | `JWT_SECRET` | a long random string |
   | `ADMIN_EMAIL` | the email you want to log in as admin with |
   | `ADMIN_PASSWORD` | your admin password |

   Vercel auto-detects this as a plain Node.js project (no framework build step needed) — you don't need
   to change any build settings.
4. Click **Deploy**. Once it finishes, you'll get a live URL like `https://coffee-lahore.vercel.app`.
5. Run the migration and seed scripts **against your production database** — you can do this from your
   own computer, since `DATABASE_URL` points at the same Neon database either way:
   ```
   npm run migrate
   npm run seed
   ```
   (You only need to do this once. Re-running `npm run seed` later is safe — it skips anything that
   already exists.)
6. Visit your live URL, log in as admin, and start adding real cafes.

### How the deployment is wired together

- `api/[...path].js` is a single serverless function that catches every request under `/api/*` and hands
  it to the same Express app used locally (defined in `app.js`) — Express does its own internal routing
  from there, so none of the route files needed to change for Vercel.
- Everything in `public/` is served automatically by Vercel's CDN as static files — no configuration
  needed for that either.
- Because Neon's driver talks to the database over HTTPS rather than a long-lived connection, it works
  the same way whether a serverless function is cold-starting or warm — there's no connection-pool setup
  to worry about.

---

## Everyday use

- Anyone can browse cafes, the top 10 lists, and read reviews without an account.
- To rate a cafe or leave a review, a visitor needs to sign up.
- After signing in, **My Dashboard** lets a person mark cafes as "tried" — private to their own account.
- Only admin accounts can reach `/admin.html` to add/remove cafes and drinks, or promote a user to
  Creator status.

## Notes & things you may want to customize later

- **Images:** the admin form takes an image *URL* rather than a file upload — paste a link to a photo
  (e.g. one hosted on Imgur or your own site). Cafes without an image show a coffee-cup icon instead.
- **Resetting the database:** if you ever want a clean slate, drop the tables in the Neon SQL console (or
  just delete and recreate the Neon project) and re-run `npm run migrate` then `npm run seed`.
- **Design tokens:** the color palette (butter yellow `#F6E4A8`, cocoa brown `#4A2E22`, gold accent
  `#C68A2E`) and fonts (Fraunces for headings, Inter for body text) live at the top of
  `public/css/style.css`.
- **Custom domain:** once deployed, you can attach your own domain to the Vercel project from its
  Settings → Domains tab.

Enjoy building your coffee community! ☕
