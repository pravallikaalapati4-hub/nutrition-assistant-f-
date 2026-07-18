# Nutrition Assistant

A full-stack nutrition tracking app: a plain HTML/CSS/JS frontend ("Harvest")
talking to an Express + MongoDB REST API, with JWT auth and role-based access
for regular users, dietitians, and admins.

```
nutrition-assistant/
├── client/
│   └── index.html      ← the whole frontend (single file, no build step)
└── server/
    ├── server.js
    ├── config/db.js
    ├── models/          User, Client, MealPlan, Progress
    ├── middleware/       auth (JWT), error handler
    ├── controllers/       auth, clients, mealplans
    └── routes/            /api/auth, /api/clients, /api/mealplans
```

## 1. Run the backend

```bash
cd server
npm install
cp .env.example .env
# edit .env: set MONGO_URI (local mongod or a MongoDB Atlas connection string)
#            set JWT_SECRET to a long random string
npm run dev      # nodemon, restarts on change
# or
npm start
```

You should see:
```
MongoDB connected: 127.0.0.1/nutrition-assistant
Nutrition Assistant API listening on http://localhost:3000
```

If you don't have MongoDB installed locally, the fastest option is a free
[MongoDB Atlas](https://www.mongodb.com/atlas) cluster — copy its connection
string into `MONGO_URI`.

## 2. Run the frontend

The frontend is a single static file and needs no build step. It's already
pointed at `http://localhost:3000/api` (see `API_BASE` near the top of the
`<script>` tag in `client/index.html`), which is the backend's default port.

Easiest ways to serve it:
```bash
cd client
npx serve .          # or: python3 -m http.server 5173
```
Then open the printed URL in your browser. (Opening `index.html` directly via
`file://` also works for most browsers, but a local static server avoids
occasional CORS/module quirks.)

Register a new account on the login screen — a regular "user" registration
automatically creates a linked `Client` profile in MongoDB, and the app's
dashboard, meal log, and macro targets all sync to the backend from then on.

## 3. API reference

All routes are prefixed with `/api`. Protected routes require
`Authorization: Bearer <token>`, where `<token>` comes from `/auth/login` or
`/auth/register`.

| Method | Route                          | Auth        | Description |
|--------|--------------------------------|-------------|--------------|
| GET    | `/health`                      | none        | Liveness check |
| POST   | `/auth/register`               | none        | `{name,email,password,role?}` → `{token,user}`. `role` may be `user` (default) or `dietitian`. |
| POST   | `/auth/login`                  | none        | `{email,password}` → `{token,user}` |
| GET    | `/auth/me`                     | any         | Returns the current user |
| GET    | `/clients`                     | any         | `user` → own client (auto-created); `dietitian` → assigned clients; `admin` → all clients |
| GET    | `/clients/:id`                 | owner/admin | Single client |
| PUT    | `/clients/:id`                 | owner/admin | Update `targetCalories`, `macroTargets`, `dietaryPreferences`, or (admin/dietitian) `dietitian` assignment |
| DELETE | `/clients/:id`                 | admin       | Delete a client |
| POST   | `/mealplans`                   | owner/admin | `{client,title,startDate,endDate,dailyCalorieTarget?,meals?}` |
| GET    | `/mealplans?client=&active=`   | owner/admin | List meal plans, optionally scoped to a client / only currently-active ones |
| GET    | `/mealplans/:id`               | owner/admin | Single meal plan |
| PUT    | `/mealplans/:id`                | owner/admin | Update fields, most commonly `meals` |
| DELETE | `/mealplans/:id`                | owner/admin | Delete a meal plan |

"owner" means: a `user` who owns the underlying client, or a `dietitian`
assigned to that client. `admin` can access everything.

## 4. Roles

- **user** — tracks their own nutrition. A `Client` record is created for
  them automatically at registration.
- **dietitian** — can be assigned to one or more clients (via
  `PUT /clients/:id { "dietitian": true }` while unassigned, or by an admin)
  and manage their meal plans.
- **admin** — full access to all clients and meal plans, and the only role
  that can delete a client. Admin accounts can't be created through public
  registration — promote a user directly in MongoDB (`role: "admin"`) or
  build a small internal seeding script if you need one.

## 5. Notes / next steps

- Passwords are hashed with bcrypt; sessions are stateless JWTs (7-day
  expiry by default, configurable via `JWT_EXPIRES_IN`).
- The `Progress` model (weight, calories consumed, adherence score) exists
  in the schema for a future "progress tracking" screen but isn't wired into
  the current frontend yet.
- For production, set `CLIENT_ORIGIN` in `.env` to your real frontend origin
  instead of `*`, and put the app behind HTTPS.
