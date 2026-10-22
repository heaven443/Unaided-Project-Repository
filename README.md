# CaleTracker Backend (`caletracker-backend`)

Robust Express REST API service with SQLite persistence for **CaleTracker** — a community-managed platform for tracking, verifying, and monitoring global retail and gaming discounts.

---

## 🛠️ Tech Stack

- **Runtime**: Node.js (v18+)
- **Framework**: Express.js
- **Database**: SQLite (built-in `node:sqlite` persistence in `./data/caletracker.sqlite`)
- **Authentication**: JWT (`jsonwebtoken`) + `bcryptjs` password hashing
- **CORS**: Configured for frontend at `http://localhost:5173`

---

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env` (already created by default):
```env
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173
JWT_SECRET=caletracker_secret_jwt_key_2026_super_secure
DATABASE_PATH=./data/caletracker.sqlite
```

### 3. Run the Server
```bash
# Development mode with auto-reload (using Node --watch)
npm run dev

# Or Production start
npm start
```

### 4. (Optional) Re-seed Sample Data
```bash
npm run seed
```

---

## 📡 API Endpoints

### Health & Info
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/` | API service status & index |
| `GET` | `/api/health` | Service health, uptime & timestamp |

### Authentication (`/api/auth`)
| Method | Endpoint | Description | Payload |
|---|---|---|---|
| `POST` | `/api/auth/register` | Register a new user | `{ "name": "User", "email": "user@example.com", "password": "password123" }` |
| `POST` | `/api/auth/login` | Login with credentials | `{ "email": "user@example.com", "password": "password123" }` |
| `GET` | `/api/auth/me` | Get profile of logged-in user | `Bearer <token>` in header |

> ### 🔑 Pre-Configured Test Accounts
>
> **1. Admin Account** (Verified, can post and delete any tracker):
> - **Email**: `admin@caletracker.com`
> - **Password**: `admin123`
> - **Role**: `admin` (`is_verified: true`)
>
> **2. Verified Normal User** (Can post trackers and delete own trackers):
> - **Email**: `verified@caletracker.com`
> - **Password**: `verified123`
> - **Role**: `user` (`is_verified: true`)
>
> **3. Unverified Normal User** (Cannot post trackers; view & upvote only):
> - **Email**: `unverified@caletracker.com`
> - **Password**: `unverified123`
> - **Role**: `user` (`is_verified: false`)

### Sale Trackers / Deals (`/api/deals`)
| Method | Endpoint | Description | Params / Body |
|---|---|---|---|
| `GET` | `/api/deals` | List all deals | Query: `?category=Gaming`, `?search=Steam`, `?sort=discount` |
| `GET` | `/api/deals/stats` | Summary statistics | Count, average discount, categories breakdown |
| `GET` | `/api/deals/:id` | Get deal details by ID | |
| `POST` | `/api/deals` | Create a new tracker | `{ "title": "Game Deal", "discount": 40, "platform": "Steam", "category": "Gaming", "ends": "Nov 15, 2026", "author": "MyName" }` |
| `POST` | `/api/deals/:id/upvote` | Community upvote / verify | |
| `PUT` | `/api/deals/:id` | Update deal (Auth required) | Bearer token |
| `DELETE` | `/api/deals/:id` | Delete deal (Auth required) | Bearer token |

---

## 📁 Project Structure

```
caletracker-backend/
├── data/
│   └── caletracker.sqlite       # Persistent SQLite database
├── src/
│   ├── config/
│   │   └── database.js           # DB connection, tables, seeders
│   ├── controllers/
│   │   ├── authController.js     # Register, login, profile logic
│   │   └── dealController.js     # Deal CRUD, search, upvote, stats
│   ├── middleware/
│   │   └── authMiddleware.js     # JWT verification & authorization
│   ├── routes/
│   │   ├── authRoutes.js         # /api/auth routes
│   │   └── dealRoutes.js         # /api/deals routes
│   ├── seed.js                   # Seed script
│   └── server.js                 # Express application & entrypoint
├── .env
├── .env.example
├── .gitignore
├── package.json
└── README.md
```



