# Bruin Bites

Rank the food at the UCLA dining halls. CS 35L, Fall 2026.

**Team:** Abhinav Garg, Dheeraj Koppu, Sampath Kalagarla, Ved Vyas, Isaac Pan

Built with React (Vite), Express, and MongoDB.

## Setup

You need [Node.js](https://nodejs.org) 20 or newer.

```bash
git clone <repo-url>
cd bruin-bites
```

### Server

```bash
cd server
npm install
cp .env.example .env
```

Open `server/.env`, paste the MongoDB connection string from the group chat, and set `SESSION_SECRET` to any long random string. Never commit `.env`.

```bash
npm run seed   # adds the starter dishes to the database
npm run dev    # starts the API on http://localhost:4000
```

### Client

In a second terminal:

```bash
cd client
npm install
npm run dev    # opens the app on http://localhost:5173
```

The client sends any request starting with `/api` to the server, so in React you can just write `fetch('/api/...')`.

### Auth API

Login state is an HttpOnly session cookie; fetch with `credentials: "include"`. Errors are `{ "error": "message" }`.

| Request | Success | Errors |
|---|---|---|
| `POST /api/auth/signup` `{ email, username, password }` | `201 { user }`, sets cookie | 400 invalid field, 409 email or username taken |
| `POST /api/auth/login` `{ email, password }` | `200 { user }`, sets cookie | 401 wrong email or password |
| `POST /api/auth/logout` | 204, clears cookie | |
| `GET /api/auth/me` | `200 { user }` | 401 not logged in |

Run `npm test`, `npm run lint`, and `npm run build` in `client/` to check the frontend. The API tests mock responses and do not require MongoDB or a running backend.

## Folders

```
client/
  src/
    pages/        one file per page (Home, Hall, Search, Login, Signup, Profile)
    components/   pieces shared between pages (NavBar)
    App.jsx       routes
server/
  index.js        Express app
  session.js      session cookie setup
  routes/         one router per feature
  middleware/     error handler
  models/         Mongoose models
  dishes.json     starter dishes for the seed script
```

## How we work

1. Pick an issue assigned to you on GitHub.
2. Make a branch for it: `git checkout -b your-name/short-description`
3. Commit as you go, then push and open a pull request into `main`.
4. Put `Closes #<issue number>` in the PR description.
5. Get one teammate to review before merging. Don't push straight to `main`.
