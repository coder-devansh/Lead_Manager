# Leadflow

Leadflow is a full-stack lead management application for sales users. It supports account authentication, private lead records, creating and editing leads, deletion confirmation, search, status filtering, sorting, pagination, and dashboard counts.

## Features

- Signup and login with JWT authentication
- Private leads for each authenticated user
- Create, view, edit, and delete leads
- Lead fields for name, email, phone, company, source, and status
- Search by name, email, or company
- Filter leads by status
- Sort leads by newest, oldest, name, or status
- Server-side pagination
- Counts for total leads in each status
- Frontend and backend validation
- Responsive desktop and mobile layout

## Technology Stack

- **React 19** - Builds the interactive frontend and reusable forms, tables, dialogs, and dashboard components.
- **Vite** - Provides the development server, `/api` proxy, and production frontend build.
- **Node.js** - Runs the JavaScript backend.
- **Express 5** - Provides REST endpoints, middleware, validation, and centralized error handling.
- **MongoDB** - Stores users and lead documents.
- **Mongoose** - Adds schemas, indexes, enum validation, timestamps, and relational ownership through an `owner` ObjectId.
- **JWT** - Identifies authenticated users and protects lead endpoints.
- **bcryptjs** - Hashes passwords before storing them.
- **Concurrently** - Starts the frontend and backend development servers with one command.

React and Vite were chosen to keep the interface responsive and easy to develop. Express was chosen because it is lightweight for the small REST API. MongoDB and Mongoose fit the document-style lead data while providing validation and indexing.

## Project Structure

```text
Leadflow/
├── client/
│   ├── src/
│   │   ├── App.jsx       # Screens, lead UI, authentication UI
│   │   ├── api.js        # Frontend API requests
│   │   ├── main.jsx      # React entry point
│   │   └── styles.css    # Responsive application styles
│   ├── index.html
│   └── vite.config.js    # API development proxy
├── server/
│   ├── src/
│   │   ├── middleware/auth.js
│   │   ├── models/Lead.js
│   │   ├── models/User.js
│   │   ├── routes/auth.js
│   │   ├── routes/leads.js
│   │   └── index.js
│   ├── test/lead.model.test.js
│   ├── .env.example
│   └── package.json
├── package.json
└── README.md
```

## Prerequisites

- Node.js 18 or newer
- npm
- MongoDB running locally or MongoDB Atlas
- Git

## How to Run Locally

### 1. Clone the repository

```bash
git clone https://github.com/coder-devansh/Lead_Manager.git
cd Lead_Manager
```

### 2. Install dependencies

```bash
npm run install:all
```

This installs the root, backend, and frontend dependencies.

### 3. Configure environment variables

Windows PowerShell:

```powershell
Copy-Item server\.env.example server\.env
```

macOS/Linux:

```bash
cp server/.env.example server/.env
```

For local MongoDB, use:

```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/leadflow
CLIENT_URL=http://localhost:5173
JWT_SECRET=replace-with-a-long-random-secret
```

For MongoDB Atlas, replace `MONGODB_URI` with the Atlas connection string:

```env
MONGODB_URI=mongodb+srv://USERNAME:PASSWORD@CLUSTER.mongodb.net/leadflow?retryWrites=true&w=majority
```

Generate a secure JWT secret with:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

Do not commit `server/.env` or expose database credentials.

### 4. Start MongoDB

If using local MongoDB, start the MongoDB service before running the application. If using Atlas, ensure the cluster is active and this machine's IP address is allowed.

### 5. Start the application

```bash
npm run dev
```

Open:

- Frontend: http://localhost:5173
- API: http://localhost:5000
- Health check: http://localhost:5000/api/health

Vite proxies `/api` requests to Express during development.

### 6. Create an account

1. Open the frontend.
2. Select **Create account**.
3. Enter a name, valid email, and password of at least six characters.
4. Add leads using **Add lead**.

## API Summary

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/auth/signup` | Create an account |
| POST | `/api/auth/login` | Authenticate a user |
| GET | `/api/leads` | List the current user's leads |
| POST | `/api/leads` | Create a lead |
| PUT | `/api/leads/:id` | Update a lead |
| DELETE | `/api/leads/:id` | Delete a lead |
| GET | `/api/health` | Check API availability |

Protected lead requests require:

```text
Authorization: Bearer JWT_TOKEN
```

Lead list parameters:

```text
search=acme&status=Qualified&sort=newest&page=1&limit=10
```

Allowed statuses: `New`, `Contacted`, `Qualified`, `Lost`.

## Testing

Run backend model tests:

```bash
npm --prefix server test
```

Create a production frontend build:

```bash
npm run build
```

## Assumptions

- MongoDB or MongoDB Atlas is available and reachable.
- The application targets a single sales user per account rather than teams or organizations.
- Lead ownership is represented by a user ObjectId.
- JWT sessions remain valid for seven days.
- The browser stores the authentication token in local storage.
- The default page size is 10, with a maximum API limit of 50.
- Ports `5173` and `5000` are available during local development.
- No email verification or password recovery service is required for the current scope.

## What I Would Improve With More Time

- Store authentication in secure HTTP-only cookies and add refresh tokens.
- Add password reset and email verification.
- Add integration and end-to-end tests.
- Add role-based team or organization support.
- Add lead activity history and change timestamps.
- Add CSV export and advanced date/source filters.
- Improve keyboard accessibility and form error announcements.
- Add rate limiting and account lockout protection.
- Configure production deployment and environment-specific CORS settings.
- Add CI checks for tests and production builds.

## Troubleshooting

### Backend unavailable

Check the API health endpoint:

```bash
curl http://localhost:5000/api/health
```

Confirm MongoDB is reachable and `server/.env` has a valid `MONGODB_URI`.

### MongoDB connection fails

- Confirm local MongoDB is running.
- Confirm Atlas credentials and database name are correct.
- For Atlas, verify the cluster IP allowlist.
- URL-encode reserved characters in database usernames or passwords.

### API proxy errors

Confirm port `5000` is not already in use and restart:

```bash
npm run dev
```

## Deployment

Leadflow supports one-service deployment or separate frontend and backend hosting.

### Option 1: Single web service

For Render or another Node.js host, use:

```text
Build command: npm run install:all && npm run build
Start command: npm run start:production
Health check: /api/health
```

Set these environment variables:

```env
NODE_ENV=production
SERVE_CLIENT=true
MONGODB_URI=your-production-mongodb-uri
JWT_SECRET=your-long-random-production-secret
PORT=provided-by-host
```

The repository includes `render.yaml` for Render Blueprint deployment. In MongoDB Atlas, allow the hosting provider's network or add the required IP access rule.

### Option 2: Separate frontend and backend

Deploy `server/` to a Node.js web service and `client/` to a static host.

Backend environment variables:

```env
NODE_ENV=production
MONGODB_URI=your-production-mongodb-uri
JWT_SECRET=your-long-random-production-secret
CLIENT_URL=https://your-frontend.example.com
PORT=provided-by-host
SERVE_CLIENT=false
```

`CLIENT_URL` may contain comma-separated origins when more than one frontend domain is required.

Frontend environment variable:

```env
VITE_API_URL=https://your-api.example.com
```

If `VITE_API_URL` is empty, the frontend uses relative `/api` requests and is appropriate when both parts share one origin.
