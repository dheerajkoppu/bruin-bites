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
| `GET /api/auth/me` | `200 { user }` | 401 not logged in |

Run `npm test`, `npm run lint`, and `npm run build` in `client/` to check the frontend. The API tests mock responses and do not require MongoDB or a running backend.

### Login API integration (proposed contract)

The login frontend assumes cookie-based sessions. The backend auth routes are still pending; confirm this contract with the backend owner:

- `POST /api/auth/login` accepts `{ email, password }`, sets an HttpOnly session cookie, and returns `{ user: { username, email, ... } }`.
- `GET /api/auth/me` returns the same user response for an active session, or HTTP 401 when signed out.
- `POST /api/auth/logout` invalidates the session and clears its cookie. Any 2xx response, including 204, indicates success.
- Failed requests return a non-2xx status with `{ message: "..." }` or `{ error: "..." }`. The frontend displays the server message.

All auth requests include cookies. Passwords and tokens are not saved in browser storage. Login redirects to `/profile`; signed-out visitors to `/profile` are sent to `/login` after the session check finishes. A failed session check offers a retry, and a failed logout preserves the current user and displays the error.

Run `npm test`, `npm run lint`, and `npm run build` in `client/`. Tests cover login, logout, navigation, and session restoration with mocked API responses. End-to-end authentication requires the real backend endpoints above.

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
