# Lead Manager

A responsive full-stack lead tracking app built with React, Node.js/Express, and MongoDB.

## Features

- Add, edit, and delete leads
- Track lead status and source
- Search by name, email, or company
- Filter leads by status
- Frontend and backend validation
- Confirmation dialog before deletion
- Signup and login with private leads per account
- Status dashboard counts
- Pagination and table sorting

## Run locally

### Prerequisites

- Node.js 18+
- MongoDB Community Server, running locally on port `27017`

### Setup

Start MongoDB locally first, then run:

```bash
npm run install:all
copy server\.env.example server\.env
npm run dev
```

Open <http://localhost:5173>. The API runs at <http://localhost:5000>.

## API

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/auth/signup` | Create an account |
| POST | `/api/auth/login` | Sign in |
| GET | `/api/leads?search=&status=&sort=&page=&limit=` | List, filter, sort, and paginate leads |
| POST | `/api/leads` | Create a lead |
| PUT | `/api/leads/:id` | Update a lead |
| DELETE | `/api/leads/:id` | Delete a lead |
| GET | `/api/health` | API health check |
