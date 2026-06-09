# BPS Event Management Portal

Full-stack event operations portal with React + Vite, Tailwind CSS, Express, MongoDB, Mongoose, JWT auth, bcrypt password hashing, Multer upload support, and role-based access control.

## Features

- No public signup; only Boss/Admin can create users.
- Login with username/email + password, or fast login with access code.
- First-login password reset and profile completion flow.
- Role dashboards for Boss/Admin, Project Manager, and Team Member.
- Event selection and event workspace tabs: Overview, Tasks, Equipment, Responsibilities, Checklist, Notes, Submissions, and Expenses.
- Boss/Admin user management, event management, password reset, access-code generation API, and monitoring dashboard.
- Project Manager scoped access to assigned events with task/equipment/workspace management.
- Team Member scoped access to assigned events, tasks, equipment, checklist, notes, submissions, and notifications.
- REST API structure ready for API testing tools.
- Production-ready optional Cloudinary upload storage for hosting.

## Project Structure

```text
.
+-- client                 # React + Vite + Tailwind app
+-- server                 # Express + Mongoose API
+-- package.json           # Root helper scripts
+-- .env.example
+-- README.md
```

## Setup

1. Install dependencies:

```bash
npm run setup
```

If Node.js is not installed globally, this workspace also supports the local runtime installed under `.tools/`:

```bash
export PATH="$PWD/.tools/bin:$PATH"
npm run setup
```

2. If you want to use the already installed local Node runtime in this workspace:

```bash
export PATH="$PWD/.tools/bin:$PATH"
```

3. Create server environment file:

```bash
cp server/.env.example server/.env
```

4. Optional client environment file:

```bash
cp client/.env.example client/.env
```

5. Start MongoDB locally, then seed dummy data:

```bash
./scripts/start-mongo.sh
```

In a second terminal:

```bash
npm run seed
```

6. Run frontend and backend:

```bash
npm run dev
```

Frontend: `http://localhost:5173`  
Backend: `http://localhost:5001/api`

For this workspace's local Node and MongoDB installs, use:

```bash
export PATH="$PWD/.tools/bin:$PATH"
npm run dev:local
```

If you open the app at `http://127.0.0.1:5173/`, the backend also allows that dev origin.

## Production Hosting

Recommended simple stack:

- Database: MongoDB Atlas
- Backend: Render or Railway
- Frontend: Vercel or Netlify
- Upload storage: Cloudinary unsigned upload preset

### Backend Environment

Set these variables on your backend host:

```bash
MONGO_URI=mongodb+srv://...
JWT_SECRET=use-a-long-random-secret
JWT_EXPIRES_IN=7d
CLIENT_URLS=https://your-frontend-domain.vercel.app
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_UPLOAD_PRESET=your_unsigned_upload_preset
CLOUDINARY_FOLDER=bps-event-portal
```

If `CLOUDINARY_CLOUD_NAME` and `CLOUDINARY_UPLOAD_PRESET` are not set, uploads use local disk. Local disk is fine for a VPS, but not reliable on serverless/free deploys because files can disappear after restarts.

### Frontend Environment

Set this variable on your frontend host:

```bash
VITE_API_URL=https://your-backend-domain.onrender.com/api
```

### Render Backend

This repo includes `render.yaml`. On Render, create a Web Service for `server/` and set these env vars:

- `NODE_VERSION=20`
- `NODE_ENV=production`
- `MONGO_URI` = your Atlas connection string
- `JWT_SECRET` = secure random secret
- `CLIENT_URLS` = comma-separated list of allowed frontend origins, e.g. `https://your-vercel-site.vercel.app`
- optional Cloudinary env vars if using upload storage

Render settings:

- Build command: `npm install`
- Start command: `npm start`
- Health path: `/api/health`

### Vercel Frontend

Deploy the `client/` folder:

- Framework: Vite
- Build command: `npm run build`
- Output directory: `dist`

Set this environment variable in Vercel:

- `VITE_API_URL=https://your-render-backend.onrender.com/api`

`client/vercel.json` is included so React Router routes refresh correctly.

### Separate hosting notes

- Backend on Render should expose only API routes.
- Frontend on Vercel should call the Render API via `VITE_API_URL`.
- `CLIENT_URLS` on the backend must include your Vercel domain so CORS succeeds.

### Seed Production Once

Run seed only once after connecting the production database:

```bash
cd server
MONGO_URI="mongodb+srv://..." JWT_SECRET="temporary-seed-secret" npm run seed
```

After seed, log in as Boss/Admin and change/reset users as needed. Do not run seed repeatedly in production because it clears existing data.

## Smoke Test

With MongoDB and the API running:

```bash
export PATH="$PWD/.tools/bin:$PATH"
node scripts/api-smoke-test.mjs
```

Expected output includes:

```json
{
  "user": "rishi",
  "role": "Boss/Admin",
  "events": 4
}
```

## Seed Logins

Boss/Admin:

- Username: `rishi`
- Email: `rishi@bps.com`
- Password: `Rishi@123`
- Access Code: `BPS-TEAM-001`

Project Manager:

- Username: `manager`
- Password: `Manager@123`
- Access Code: `BPS-MANAGER-001`

Team Member:

- Username: `team`
- Password: `Team@123`
- Access Code: `BPS-MEMBER-001`

## Main API Routes

- `POST /api/auth/login`
- `GET /api/auth/me`
- `POST /api/auth/first-login`
- `GET|POST /api/users`
- `PUT|DELETE /api/users/:id`
- `PATCH /api/users/:id/reset-password`
- `PATCH /api/users/:id/access-code`
- `GET|POST /api/events`
- `GET|PUT|DELETE /api/events/:id`
- `GET|POST /api/tasks`
- `GET|POST /api/equipment`
- `GET|POST /api/responsibilities`
- `GET|POST /api/checklist`
- `GET|POST /api/notes`
- `GET|POST /api/notifications`
- `GET|POST /api/submissions`
- `PATCH /api/submissions/:id/review`
- `GET /api/dashboard`

Use `Authorization: Bearer <token>` for protected routes.
