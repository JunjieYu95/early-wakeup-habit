# Early Wakeup Habit Tracker (Vue + Node on Vercel)

A simple habit record app to track your early wakeup journey:
- Daily checkmark (woke up early or not)
- Upload **one image per day** (stored in Cloudinary)
- Beautiful tracking UI:
  - Calendar view
  - Timeline view

## Tech stack
- Frontend: Vue 3 + Vite
- Backend: Vercel Serverless Functions (Node.js)
- Database: Turso (libSQL) via `@libsql/client`
- Image hosting: Cloudinary (signed upload)
- Deployment: Vercel

---

## 1) Prerequisites
- Node.js 18+
- Vercel CLI (`npm i -g vercel`) (repo includes it as a devDependency too)
- A Turso database
- A Cloudinary account

---

## 2) Environment variables

Create `.env.local` in the repo root (Vercel uses the same variable names).

```bash
# Turso
TURSO_DATABASE_URL="libsql://...turso.io"
TURSO_AUTH_TOKEN="..."

# Cloudinary
CLOUDINARY_CLOUD_NAME="your_cloud_name"
CLOUDINARY_API_KEY="..."
CLOUDINARY_API_SECRET="..."
CLOUDINARY_FOLDER="early-wakeup"  # optional (defaults to "early-wakeup")
```

---

## 3) Create table schema in Turso

This repo includes `db/schema.sql`. Apply it with:

```bash
npm install
npm run init-db
```

---

## 4) Run locally

This starts:
- Vite web dev server
- Vercel dev server (serves `/api/*`)

```bash
npm run dev
```

Open the app at:
- http://localhost:5173

The web app proxies `/api/*` to http://localhost:3000 in dev.

---

## 5) Deploy to Vercel

1. Push the repo to GitHub.
2. Import into Vercel.
3. Set the environment variables in Vercel (same names as above).
4. Deploy.

Vercel will:
- Build the Vue app into `apps/web/dist`
- Serve serverless functions from `/api`

---

## Data model

One row per calendar date (YYYY-MM-DD):

- `date` (PRIMARY KEY)
- `checked` (0/1)
- `image_url` (Cloudinary URL, optional)
- `image_public_id` (Cloudinary public_id, optional)
- `note` (optional)
- `created_at`, `updated_at`

---

## API endpoints

- `GET /api/records?from=YYYY-MM-DD&to=YYYY-MM-DD`
- `POST /api/records` `{ date, checked, imageUrl, imagePublicId, note }`
- `GET /api/records/:date`
- `PUT /api/records/:date` `{ checked?, imageUrl?, imagePublicId?, note? }`
- `DELETE /api/records/:date`
- `POST /api/cloudinary/signature` -> `{ timestamp, signature, apiKey, cloudName, folder }`

