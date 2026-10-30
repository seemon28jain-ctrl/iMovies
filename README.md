# IMovies - Movie ticket booking made simple.

**iMovies** is a modern, production-ready movie ticket booking platform built with **React + Vite**, **Node.js + Express**, **MongoDB**, **Socket.io**, and dark-cinema glassmorphic styling (Jet Black, Royal Amethyst, and Electric Cyan).

---

## Project Documentation

Detailed system architecture, engineering roles, and technical diagrams are maintained inside the [`docs/`](docs/) directory:

| Document | Description |
| :--- | :--- |
|  **[System Architecture](docs/architecture.md)** | MVC pattern implementation, backend models, controller logic, API lifecycle, and security. |
|  **[Roles & Responsibilities](docs/roles.md)** | Team contribution matrix, engineering roles, and core module ownership. |
|  **[ER Diagram](docs/diagrams/er-diagram.md)** | Entity-Relationship schema diagram modeling database entities, keys, and cardinalities. |
|  **[User Flow Diagram](docs/diagrams/user-flow.md)** | End-to-end journey diagram from landing page to seat locking, payment, and ticket delivery. |

---

## Key Features

### User Experience
- **Live TMDB Market Feed**: Real-time trending movies, top 10 rankings, upcoming releases, and now-showing titles.
- **Interactive Multi-Tier Seat Map**: Visual seating with Balcony, Middle, and Lower tiers.
- **Real-Time Seat Locking**: Powered by **Socket.io** with live conflict prevention and automated 10-minute lock expiry cleanup.
- **Online Checkout with Razorpay**: Test-mode payment gateway supporting UPI, NetBanking, Credit/Debit Cards, and Wallets with HMAC-SHA256 signature verification.
- **Email Verification & OTP**: Integrated with **Brevo (Sendinblue)** for 6-digit OTP authentication, email confirmation links, password reset, and digital ticket delivery.

### Admin Command Center
- **Telemetry & Analytics**: Real-time reservation stats, revenue charts, and platform occupancy.
- **Transactions & Refund Management**: Issue direct refunds via Razorpay API and automatically release booked seats.
- **Full Catalog Management**: View, search, and delete Movies, Theatres, and Shows with instant confirmation modals.
- **Any-Time Show Scheduler**: Schedule screenings at any arbitrary time with custom time pickers and quick presets.
- **Global Movie Importer**: Search from millions of worldwide titles on TMDB and 1-click auto-fill all metadata (posters, cast, runtime, certification, synopsis).
- **Simplified Theatre Creation**: Automatic unique `theatreId` generation without manual friction.

---

## Tech Stack

- **Client**: React 18, Vite, Bootstrap 5, FontAwesome, Day.js, React-Toastify, Axios, Socket.io-client.
- **Server**: Node.js, Express, MongoDB (Mongoose), Socket.io, Node-Cron, JWT, bcryptjs.
- **Third-Party Services**:
  - **Razorpay**: Online payments and refunds.
  - **Brevo**: Transactional emails and OTP delivery.
  - **TMDB API**: Global cinema metadata and posters.

---

## Quick Start Guide

### 1. Prerequisites
- **Node.js** (v18+)
- **MongoDB** running locally on `mongodb://localhost:27017`

### 2. Backend Setup
```bash
cd server
npm install
cp .env.example .env
# Fill in your Brevo, Razorpay, and MongoDB keys in server/.env
npm run dev
# Server runs on http://localhost:5000
```

### 3. Frontend Setup
```bash
cd client
npm install
npm run dev
# Client runs on http://localhost:3000
```

---

## Admin Credentials (Default)
- **Admin Email**: `sample.ex.com`
- **Password**: `sample`

---
