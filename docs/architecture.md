# 🏗️ iMovies Architecture & System Design

This document details the architectural design, Model-View-Controller (MVC) pattern implementation, request lifecycle, real-time communication, and data flow mechanisms powering the **iMovies** cinema booking platform.

---

## 🏛️ Architectural Overview

iMovies adopts a decoupled, modern **Client-Server MVC** architecture:
- **Presentation Layer (Views)**: Built with **React 18** and **Vite**, utilizing client-side routing, glassmorphic UI components, real-time WebSocket bindings, and responsive mobile-first layouts.
- **Application & API Layer (Controllers & Routes)**: An **Express.js** engine exposing clean RESTful endpoints, secured by custom middleware, structured try-catch exception boundaries, and JWT token validation.
- **Persistence Layer (Models)**: **MongoDB** managed through **Mongoose**, featuring strict schema schemas, compound uniqueness indexes, and embedded ticket objects.
- **Domain Services & Utilities**: Dedicated service modules handling external integrations (**Razorpay**, **Brevo**, **TMDB**), scheduled cron automations, dynamic URL resolution, and database self-healing.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          CLIENT (Vite + React 18)                       │
│  [Pages / Views]  ───  [Axios Interceptor]  ───  [Socket.io Client]    │
└────────────┬──────────────────────────────────────────────────▲─────────┘
             │ HTTP REST (JSON)                                 │ WebSockets
             ▼                                                  ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                       SERVER (Node.js + Express)                        │
│                                                                         │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │ Middlewares: Dynamic CORS, JSON Parser, fetchUser, fetchAdmin     │  │
│  └─────────────────────────────────┬─────────────────────────────────┘  │
│                                    ▼                                    │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │ Controllers: Auth, Movie, Theatre, Show, Booking, Payment, Email  │  │
│  └──────────────────┬───────────────────────────────┬────────────────┘  │
│                     │                               │                   │
│                     ▼                               ▼                   │
│  ┌───────────────────────────────────┐   ┌───────────────────────────┐  │
│  │ Services & Crons:                 │   │ Mongoose Models:          │  │
│  │ • Brevo Email Service             │   │ • User & Admin            │  │
│  │ • Razorpay Signature Verification │   │ • Movie & Theatre         │  │
│  │ • TMDB Discovery Service          │   │ • Show & Booking          │  │
│  │ • Seat Lock Cleanup (Node-Cron)   │   │ • Review & Favorite       │  │
│  │ • Show Reminder Cron              │   └─────────────┬─────────────┘  │
│  └───────────────────────────────────┘                 │                │
└────────────────────────────────────────────────────────┼────────────────┘
                                                         ▼
                                            ┌─────────────────────────┐
                                            │      MongoDB Database   │
                                            └─────────────────────────┘
```

---

## 📊 1. Models (Persistence Layer)

All data structures are defined in `server/models/` using Mongoose schemas:

### `UserModel` (`models/userModel.js`)
- **Purpose**: Stores customer profiles, authentication credentials, and verification state.
- **Key Attributes**:
  - `username`: String (3–20 chars, unique, trimmed).
  - `email`: String (lowercase, unique, validated).
  - `password`: Salted and hashed using `bcryptjs` (10 rounds).
  - `isVerified`: Boolean (enforced; unverified users cannot sign in).
  - `verificationOtp` & `verificationOtpExpires`: 6-digit OTP code with 24-hour validity.
  - `verificationToken` & `verificationTokenExpires`: 32-byte crypto token for 1-click links.
  - `resetPasswordToken` & `resetPasswordExpires`: 30-minute expiration token.

### `AdminModel` (`models/adminModel.js`)
- **Purpose**: Dedicated administrative credentials granting platform-wide command privileges.
- **Key Attributes**: `username`, `email`, `password` (bcrypt hashed).

### `TheatreModel` (`models/theatreModel.js`)
- **Purpose**: Represents physical cinemas and their specific seating arrangements across three tiers.
- **Key Attributes**:
  - `theatreId`: Unique slug string (e.g. `pvr-imax-01`).
  - `theatreName`, `location`: Cinema identification.
  - `balconySeatPrice`, `middleSeatPrice`, `lowerSeatPrice`: Tiered pricing numbers.
  - `balconySeats`, `middleSeats`, `lowerSeats`: Coordinate objects storing individual seat descriptors (`{ A1: { seatNumber: 'A1', row: 'A', col: 1 } }`).
  - `isActive`: Boolean flag for catalog toggling.

### `MovieModel` (`models/movieModel.js`)
- **Purpose**: Stores movie metadata, cast information, media assets, and ratings.
- **Key Attributes**:
  - `tmdbId`: Unique numeric ID from The Movie Database (allows seamless synchronization).
  - `movieName`, `description`, `genres`: Categorization and synopsis.
  - `releaseDate`, `language`, `duration`, `certification`: Content specifics.
  - `posterUrl`, `trailerUrl`: External visual media links.
  - `cast`: Array of `{ name, role }` objects.
  - `avgRating`: Aggregated customer score (1.0–5.0).
  - `isActive`: Soft delete flag.

### `ShowModel` (`models/showModel.js`)
- **Purpose**: Represents an individual screening event of a movie at a specific theatre, date, and time.
- **Key Attributes**:
  - `showId`: UUID v4 string.
  - `movieId`: Reference ID linking to the Movie document.
  - `theatreId`, `theatreName`: Linked cinema details.
  - `showDate` (format: `YYYY-MM-DD`), `showTime` (format: `hh:mm A`).
  - `tickets`: Stateful seat dictionary initialized from the theatre layout:
    ```json
    {
      "A1": {
        "seatId": "A1",
        "type": "balcony",
        "price": 450,
        "status": "available",
        "lockExpiry": null,
        "bookedBy": null
      }
    }
    ```

### `BookingModel` (`models/bookingModel.js`)
- **Purpose**: Formal record of a finalized transaction.
- **Key Attributes**:
  - `bookingId`: Unique order identifier (`BK-XXXXXX` or UUID).
  - `userEmail`: Associated customer.
  - `showId`, `movieId`, `theatreName`, `showDate`, `showTime`: Snapshot details.
  - `selectedSeats`: Array of reserved seat IDs (e.g. `["A1", "A2"]`).
  - `totalAmount`: Final billed sum.
  - `paymentStatus`: Enum `['Pending', 'Completed', 'Failed', 'Cancelled']`.
  - `razorpayOrderId`, `razorpayPaymentId`, `razorpaySignature`: Gateway cryptographic proof.
  - `reminderSent`: Flag indicating if 24-hour pre-show notification was dispatched.

### `ReviewModel` (`models/reviewModel.js`) & `FavoriteModel` (`models/favoriteModel.js`)
- Compound unique index `{ userEmail: 1, movieId: 1 }` prevents redundant reviews or duplicate watchlist items.

---

## 🎮 2. Controllers (Business Logic Layer)

Located in `server/controllers/`, these modules isolate business rules from HTTP transport:

| Controller | Responsibilities | Key Methods |
| :--- | :--- | :--- |
| **`authController`** | User/Admin registration, password hashing, JWT signing, OTP verification, password reset | `registerUser`, `verifyOtp`, `loginUser`, `loginAdmin`, `forgotPassword`, `resetPassword` |
| **`movieController`** | TMDB synchronization, curated collections (Top 10, Now Showing, Upcoming), catalog CRUD | `getAllMovies`, `getCuratedSections`, `getMovieById`, `addMovie`, `updateMovie`, `deleteMovie` |
| **`theatreController`**| Cinema onboarding, seat layout registration, automatic ID slug generation, cinema updates | `getAllTheatres`, `getTheatreById`, `addTheatre`, `updateTheatre`, `deleteTheatre` |
| **`showController`** | Screening scheduling, fast bulk show generation, retrieval with seat statuses | `getAllShows`, `getShowsByMovie`, `getShowById`, `addShow`, `deleteShow` |
| **`bookingController`**| Atomic seat reservation locks, booking confirmation, user order history, cancellations | `lockSeats`, `createBooking`, `getUserBookings`, `cancelBooking` |
| **`paymentController`**| Razorpay order generation, HMAC-SHA256 signature verification, automated refunds | `createRazorpayOrder`, `verifyPayment`, `processRefund`, `getAllTransactions` |
| **`emailController`**  | Brevo email verification endpoints, password recovery links, test runners | `sendTestEmail`, `triggerVerificationEmail`, `triggerPasswordResetEmail` |
| **`adminController`**  | Dashboard telemetry aggregation, revenue time-series analysis, user management | `getDashboardStats`, `getRevenueAnalytics`, `getAllUsers`, `addSubAdmin` |

---

## 🎨 3. Views & Presentation Layer (Client)

The frontend lives in `client/` and is built as a single-page application (SPA):

### Design System & Theme
- **Color Palette**: Ultra-modern cinema theme featuring **Jet Black** (`#050505`), **Royal Amethyst** (`#3B0A6B`), and **Electric Cyan** (`#00E5FF`).
- **Glassmorphism**: Backdrop blur (`backdrop-filter: blur(16px)`), translucent border highlights, and dark gradient cards.
- **Responsive Layout**: Bootstrap 5 grid combined with custom CSS flexbox and media queries.

### Route Architecture (`client/src/App.jsx`)
- **Lazy Loading**: All pages are code-split via `React.lazy()` and wrapped in `<Suspense fallback={<Loader />}>`.
- **Guards**:
  - `<UserProtection>`: Checks for `imovies-token` in `localStorage`; redirects to `/login` if unauthenticated.
  - `<AdminProtection>`: Checks for `imovies-admin-token`; restricts unauthorized visitors.
- **SPA Rewrites**: Supported through [`client/vercel.json`](file:///C:/Users/seemo/.gemini/antigravity/scratch/iMovies/client/vercel.json) to eliminate 404s on direct URL refreshes.

### Real-Time Seat Component (`client/src/pages/SeatMapPage.jsx`)
- Establishes a WebSocket connection to the backend Socket.io server.
- Joins the specific room: `socket.emit('join-show', { showId })`.
- Dynamically responds to:
  - `seats-locked`: Renders seats as locked (amber/yellow) by concurrent users.
  - `seats-released`: Restores seats to available state (dark grey).
  - `seat-status-update`: Full status reload on confirmed booking.

---

## ⚡ 4. Request Lifecycle & Data Flows

### A. Authentication & Verification Lifecycle
```
1. Client submits registration form with email and password.
2. authController hashes password with bcryptjs and generates:
   - 6-digit OTP (e.g. 749215) valid for 24h
   - 32-byte crypto verification token
3. emailService contacts Brevo REST API to dispatch responsive HTML email.
4. Client enters 6-digit OTP -> POST /api/auth/verify-otp
5. Backend verifies OTP match and expiration, sets isVerified: true, and issues signed JWT.
```

### B. Seat Lock & Checkout Lifecycle
```
1. User selects seats on SeatMapPage (e.g., A1, A2).
2. Client calls POST /api/bookings/lock
3. bookingController checks show.tickets:
   - If any seat is 'booked' or 'locked' (with active lockExpiry), returns HTTP 400.
   - If available, marks seats as 'locked' with lockExpiry = Date.now() + 10 minutes.
4. Socket.io broadcasts 'seats-locked' to all clients in room(showId).
5. Client clicks 'Pay' -> POST /api/payment/create-order
6. paymentController calls Razorpay API:
   - Sets amount in paise (₹100 = 10000 paise).
   - Returns razorpayOrderId to client.
7. Razorpay Checkout modal handles user's card/UPI.
8. On success, modal returns:
   - razorpay_payment_id
   - razorpay_order_id
   - razorpay_signature
9. Client posts credentials to POST /api/payment/verify
10. Backend computes HMAC-SHA256 signature using RAZORPAY_KEY_SECRET:
    crypto.createHmac('sha256', secret).update(order_id + '|' + payment_id).digest('hex')
11. If signatures match:
    - Seats updated from 'locked' to 'booked'.
    - Booking document created in MongoDB with paymentStatus = 'Completed'.
    - Brevo emailService dispatches HTML ticket to user.
    - Socket.io broadcasts 'seat-status-update'.
```

### C. Background Automated Crons
- **Seat Lock Cleanup (`cleanupService.js`)**:
  - Runs every 2 minutes: `*/2 * * * *`.
  - Queries all shows for tickets where `status === 'locked'` and `lockExpiry < Date.now()`.
  - Reverts expired tickets to `status: 'available'` and broadcasts updates.
- **Show Reminder (`reminderService.js`)**:
  - Runs every hour: `0 * * * *`.
  - Identifies confirmed bookings with `showDate` within the next 24 hours where `reminderSent === false`.
  - Dispatches upcoming screening reminder emails and updates `reminderSent: true`.

---

## 🔒 5. Security & Production Safeguards

1. **Secret Isolation**:
   - `RAZORPAY_KEY_SECRET`, `BREVO_API_KEY`, and `JWT_SECRET` reside solely in backend `.env` variables and are never bundled in client assets.
   - Client-side checkout only consumes the public `RAZORPAY_KEY_ID`.
2. **Dynamic CORS Configuration**:
   - Resolves incoming browser `Origin` headers dynamically to support production Vercel frontend deployments (`*.vercel.app`) as well as local development environments with full preflight HTTP 200 handling.
3. **Database Self-Healing (`autoSeeder.js`)**:
   - Automatically initializes fresh cloud MongoDB Atlas clusters on first deployment with essential admin accounts, core theatres, and upcoming screenings without requiring manual CLI seeding.
