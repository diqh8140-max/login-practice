# Login Practice

A full-stack login and account management practice project built with Node.js, Express, PostgreSQL, HTML, CSS, and JavaScript.

## Live Demo

https://login-practice-1.onrender.com

## Features

- User registration
- User login
- Password hashing with Node.js `crypto.scrypt`
- PostgreSQL database
- Session and cookie authentication
- Persistent login during a session
- Protected profile API
- User profile page
- Change password
- Logout
- HTTPS deployment with Render

## Tech Stack

### Frontend

- HTML
- CSS
- JavaScript
- Fetch API

### Backend

- Node.js
- Express
- express-session

### Database

- PostgreSQL

### Security

- Passwords are not stored as plain text
- Password hashing uses `crypto.scrypt`
- Random salt for each password
- `timingSafeEqual` is used when comparing password hashes
- Session cookies use `httpOnly`
- HTTPS is enabled in production
- Secrets are stored using environment variables

## Project Structure

```text
login-practice/
│
├── public/
│   ├── index.html
│   ├── register.html
│   ├── welcome.html
│   ├── profile.html
│   ├── login.js
│   ├── register.js
│   ├── welcome.js
│   ├── profile.js
│   └── style.css
│
├── server.js
├── package.json
├── package-lock.json
├── .gitignore
└── README.md

### How It Works
Registration
User enters a username and password.
The frontend sends the data to /api/register.
The server hashes the password using crypto.scrypt.
The username and password hash are stored in PostgreSQL.
Login
User enters their username and password.
The frontend sends the credentials to /api/login.
The server finds the user in PostgreSQL.
The entered password is verified against the stored hash.
If authentication succeeds, a session is created.
Authentication

The server stores the logged-in user's ID in the session:

req.session.userId = user.id;
req.session.username = user.username;

The browser receives a session cookie and sends it automatically with later requests.

Protected API routes use the session to determine which user is logged in.

### What I Learned

This project helped me practice:

Connecting frontend and backend code with HTTP requests
Building REST-style API endpoints with Express
Working with PostgreSQL
Password hashing and verification
Session and cookie authentication
Protecting backend routes
Environment variables
Deploying a Node.js application to Render
Debugging deployment and database issues