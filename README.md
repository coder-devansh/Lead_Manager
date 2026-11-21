# Leadflow

Leadflow is a full-stack lead management application that allows sales users to create accounts, manage their own leads, update lead status, search and filter records, and view status-based dashboard counts.

## Features

- Secure signup and login
- Private leads for each authenticated user
- Create, view, edit, and delete leads
- Lead fields: name, email, phone, company, source, and status
- Search by name, email, or company
- Filter by lead status
- Sort leads by newest, oldest, name, or status
- Server-side pagination
- Dashboard counts for every status
- Delete confirmation dialog
- Frontend and backend validation
- Responsive desktop and mobile interface
- REST API with authentication and ownership checks

## Technology Stack

### React.js

React provides the interactive, component-based frontend.

It is used for:

- Authentication screens
- Lead forms and confirmation dialogs
- Search and status filtering
- Sorting and pagination controls
- Dashboard summaries
- Responsive user interface updates

Vite is used to run the React development server and optimize production builds.

### Node.js and Express.js

Node.js runs the backend JavaScript server.

Express.js provides the REST API used for:

- User signup and login
- Lead CRUD operations
- Filtering and sorting
- Pagination
- Status aggregation
- Input validation
- Authentication middleware
- Error handling

### MongoDB and Mongoose

MongoDB stores application data as documents.

Mongoose provides schemas and validation before data is saved.

The application uses two main collections:

- `users`
- `leads`

Every lead contains an `owner` field referencing the user who created it. Lead update and delete operations check both the lead ID and owner ID, preventing one user from changing another user's leads.

The database also uses indexes for status, creation date, owner, and combined owner/status queries.

### JSON Web Tokens

JWT authentication gives each user a temporary signed session.

After login or signup:

1. The server returns a JWT.
2. The browser stores the token locally.
3. Protected API requests include the token in the authorization header.
4. The server verifies the token and identifies the authenticated user.
5. Database queries are automatically restricted to that user.

Passwords are hashed with bcrypt before being stored. The original password is never saved.

## Project Structure

```text
Leadflow/
├── client/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── api.js
│   │   ├── main.jsx
│   │   └── styles.css
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
├── server/
│   ├── src/
│   │   ├── middleware/
│   │   │   └── auth.js
│   │   ├── models/
│   │   │   ├── Lead.js
│   │   │   └── User.js
│   │   ├── routes/
│   │   │   ├── auth.js
│   │   │   └── leads.js
│   │   └── index.js
│   ├── test/
│   │   └── lead.model.test.js
│   ├── .env.example
│   └── package.json
├── package.json
└── README.md
