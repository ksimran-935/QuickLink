# LinkShort — URL Shortening & Analytics Platform

A full-stack URL shortener built with React, Node.js, Express, and MongoDB. Built as a portfolio project demonstrating practical software engineering concepts.

## Features

- **JWT Authentication** — register, login, stateless sessions
- **Short URL creation** — auto-generated 7-character codes or custom aliases
- **URL expiration** — optional expiry date; MongoDB TTL index handles auto-deletion
- **Click tracking** — per-click records with timestamp, referrer, and user agent
- **Analytics dashboard** — total clicks and recent click history
- **Search & pagination** — filter your links by URL or short code
- **Delete URLs** — removes the URL and all associated click records
- **Rate limiting** — 10 req/15 min on auth routes, 100 req/15 min on API routes
- **Input validation** — server-side validation on all inputs via express-validator
- **Centralized error handling** — consistent JSON error responses across all routes

## Tech Stack

| Layer    | Technology |
|----------|------------|
| Frontend | React 19, Vite, React Router v7, Axios |
| Backend  | Node.js, Express.js |
| Database | MongoDB, Mongoose |
| Auth     | JSON Web Tokens (JWT), bcryptjs |
| Other    | express-rate-limit, express-validator, nanoid |

## Project Structure

```
URL Shortner/
├── server/                  # Express REST API
│   ├── config/db.js         # MongoDB connection
│   ├── controllers/
│   │   ├── authController.js
│   │   └── urlController.js
│   ├── middleware/
│   │   ├── auth.js          # JWT verification
│   │   ├── errorHandler.js  # Centralized error handler
│   │   ├── rateLimiter.js
│   │   └── validate.js
│   ├── models/
│   │   ├── User.js
│   │   ├── Url.js
│   │   └── Click.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── urls.js
│   │   └── redirect.js
│   ├── utils/generateCode.js
│   └── index.js
│
└── client/                  # React + Vite SPA
    └── src/
        ├── api/axios.js     # Axios instance + interceptors
        ├── context/AuthContext.jsx
        ├── components/
        │   ├── Navbar.jsx
        │   └── ProtectedRoute.jsx
        └── pages/
            ├── Login.jsx
            ├── Register.jsx
            ├── Dashboard.jsx
            └── Analytics.jsx
```

## Prerequisites

- [Node.js](https://nodejs.org/) v18 or later
- [MongoDB](https://www.mongodb.com/try/download/community) running locally (default port 27017)

## Getting Started

### 1. Clone the repository

```bash
git clone <your-repo-url>
cd "URL Shortner"
```

### 2. Set up the backend

```bash
cd server
cp .env.example .env
# Edit .env and set a strong JWT_SECRET
npm install
npm run dev
```

### 3. Set up the frontend

```bash
cd client
npm install
npm run dev
```

### 4. Open the app

Visit **http://localhost:5173** in your browser.

## Environment Variables

### server/.env

| Variable        | Description                         | Default                              |
|----------------|-------------------------------------|--------------------------------------|
| `PORT`          | Server port                         | `5000`                               |
| `MONGO_URI`     | MongoDB connection string            | `mongodb://localhost:27017/urlshortener` |
| `JWT_SECRET`    | Secret key for signing JWTs         | **Change this in production**        |
| `JWT_EXPIRES_IN`| Token expiration duration           | `7d`                                 |
| `CLIENT_URL`    | Allowed CORS origin                 | `http://localhost:5173`              |
| `BASE_URL`      | Server base URL (used in responses) | `http://localhost:5000`              |

### client/.env

| Variable        | Description              | Default                   |
|----------------|--------------------------|---------------------------|
| `VITE_API_URL`  | Backend API base URL     | `http://localhost:5000`   |

## API Reference

### Authentication

| Method | Endpoint                | Auth | Body                              |
|--------|-------------------------|------|-----------------------------------|
| POST   | `/api/auth/register`    | —    | `{ name, email, password }`       |
| POST   | `/api/auth/login`       | —    | `{ email, password }`             |

### URLs

| Method | Endpoint                      | Auth | Description                       |
|--------|-------------------------------|------|-----------------------------------|
| POST   | `/api/urls`                   | ✅   | Create short URL                  |
| GET    | `/api/urls`                   | ✅   | List URLs (search, page, limit)   |
| DELETE | `/api/urls/:id`               | ✅   | Delete a URL (owner only)         |
| GET    | `/api/urls/:id/analytics`     | ✅   | Get click analytics               |
| GET    | `/:shortCode`                 | —    | Redirect to original URL          |

### POST /api/urls — Request body

```json
{
  "longUrl": "https://example.com/very/long/path",
  "alias": "my-link",
  "expiresAt": "2025-12-31"
}
```

`alias` and `expiresAt` are optional.

## Security Decisions

| Concern | Approach |
|---------|----------|
| Password storage | bcrypt with cost factor 10 |
| Auth tokens | JWT, stored in `localStorage` on client |
| Auth errors | Generic "Invalid email or password" — does not reveal whether the email exists |
| Route protection | JWT verified on every protected request |
| Ownership | Every mutating URL operation checks `url.owner === req.user.id` |
| Rate limiting | Strict on auth (10/15 min), relaxed on API (100/15 min) |
| CORS | Origin restricted to `CLIENT_URL` env variable |
| Body size | `express.json({ limit: "10kb" })` rejects oversized payloads |

## MongoDB Indexes

| Collection | Index | Purpose |
|------------|-------|---------|
| `users`    | `{ email: 1 }` unique | Fast login lookup, prevents duplicate accounts |
| `urls`     | `{ shortCode: 1 }` unique | Fast redirect lookup |
| `urls`     | `{ owner: 1, createdAt: -1 }` | Fast dashboard queries per user |
| `urls`     | `{ expiresAt: 1 }` TTL | Auto-deletes expired documents |
| `clicks`   | `{ url: 1, timestamp: -1 }` | Fast analytics queries per URL |

## Running in Production

1. Set `NODE_ENV=production` in server `.env`
2. Set a strong random `JWT_SECRET`
3. Set `MONGO_URI` to your production database
4. Build the frontend: `cd client && npm run build`
5. Serve the built `client/dist` folder via a static host or reverse proxy
6. Run the server with a process manager: `pm2 start server/index.js`
