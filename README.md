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

Open `server/.env` and paste the MongoDB connection string from the group chat. Never commit `.env`.

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

### Signup API integration (proposed contract, Since US1 frontend relies on API Integration)

The signup frontend is implemented; the auth API is still pending. Confirm these assumptions with the backend owner before end-to-end testing:

- `POST /api/auth/signup` accepts JSON `{ email, username, password }`. On success it returns `{ user: { username, email, ... } }` and sets an HttpOnly session cookie, logging the new student in.
- Failed signup returns a non-2xx status with `{ message: "..." }` (or `{ error: "..." }`). The form displays that server message, including duplicate-email and duplicate-username errors.
- `GET /api/auth/me` returns `{ user: { username, email, ... } }` for an existing session, or HTTP 401 when signed out. This restores the profile and navigation after a page refresh.

Requests include cookies. Auth tokens and passwords are not stored in browser storage. After successful signup the client keeps the returned user in React context and redirects to `/profile`. Without these backend endpoints, signup cannot create accounts or establish a session.

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
  models/         Mongoose models
  dishes.json     starter dishes for the seed script
```

## How we work

1. Pick an issue assigned to you on GitHub.
2. Make a branch for it: `git checkout -b your-name/short-description`
3. Commit as you go, then push and open a pull request into `main`.
4. Put `Closes #<issue number>` in the PR description.
5. Get one teammate to review before merging. Don't push straight to `main`.
