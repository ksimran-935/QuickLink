# ⚡ QuickLink — Full-Stack URL Shortener & Analytics
A production-ready URL shortening service built with React, Node.js, Express, and MongoDB. Designed with a focus on clean architecture, security, and performance.

🔗 **Live Demo:** [https://quicklink-client.onrender.com](https://quicklink-client.onrender.com)  


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




## 🚀 Local Development Setup
To run this project locally, you need Node.js and a local or cloud MongoDB database.
### 1. Clone the repository
```bash
git clone https://github.com/YOUR_USERNAME/quicklink.git
cd quicklink
