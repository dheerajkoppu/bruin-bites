# Bruin Bites

Rank the food at the UCLA dining halls. CS 35L, Fall 2026.

**Live site:** https://bruin-bites.onrender.com

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

### Profile ratings

`/profile` fetches the signed-in user's saved ratings from `GET /api/ratings/me` with the session cookie each time the page opens, including after logging back in. It groups dishes under "Liked it", "It was fine", and "Didn't like it", orders each group by ascending `position` (best first), and displays numbered dishes with the API's scores out of 10 to one decimal place. Ratings and scores are stored or calculated by the API, with no browser storage used for persistence.

The frontend expects an array of populated ratings:

```json
[
  {
    "_id": "rating-id",
    "group": "liked",
    "position": 0,
    "score": 10,
    "dish": { "_id": "dish-id", "name": "Pasta", "hall": "Epicuria" }
  }
]
```

`group` is `liked`, `fine`, or `disliked`; `position` is a nonnegative integer within the group, and `score` is a finite number from 0 to 10. An account with no ratings returns `[]`. The backend owns score calculation (liked: 7–10, fine: 4–6.9, disliked: 0–3.9). The rating and ranking APIs are tracked in #22 and #25 and are not implemented in this branch. Until the ranked response is available, the profile shows an error with a retry button. Frontend tests mock this contract; verifying real rankings and persistence across logout and login requires that backend.

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
render.yaml       Render deploy settings
```

## Deploying

The live site runs on [Render](https://render.com) as one web service. Express serves both the API and the built React app, so they share one domain and the login cookie works. The settings are in `render.yaml`.

Every merge into `main` deploys on its own once the CI check passes. You don't need to do anything.

The live site uses its own database, `bruin-bites-prod`, in the same Atlas cluster, so testing on your laptop doesn't touch it. The free plan sleeps after 15 minutes with no visitors, so the first page load after that can take up to a minute.

## How we work

1. Pick an issue assigned to you on GitHub.
2. Make a branch for it: `git checkout -b your-name/short-description`
3. Commit as you go, then push and open a pull request into `main`.
4. Put `Closes #<issue number>` in the PR description.
5. Wait for the CI check on your PR to pass. It runs lint, tests, and the build in `client/`, and installs and syntax-checks `server/`. If it fails, click "Details" on the check to see why.
6. Get one teammate to review before merging. Don't push straight to `main`.

## Photo credits

Dining hall photos are from Wikimedia Commons: [Carnesale Commons](https://commons.wikimedia.org/wiki/File:UCLA_Carnesale_Commons.jpg), [De Neve](https://commons.wikimedia.org/wiki/File:UCLA_De_Neve_2016-03-14.jpg), and [Covel](https://commons.wikimedia.org/wiki/File:UCLA_Covel_2015-08-04.jpg) by Yhz1221 (CC BY-SA 4.0), and [Rieber Terrace](https://commons.wikimedia.org/wiki/File:Rieber_Terrace,_UCLA.jpg) by Nikkul (CC BY-SA 3.0).
