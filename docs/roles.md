# 👥 Team Roles & Responsibilities

This document outlines the collaborative engineering structure, role allocations, core technical responsibilities, and module ownership for the **iMovies** platform.

---

## 📋 Contribution & Responsibility Matrix

| Team Role | Primary Focus | Core Modules & Responsibilities | Technologies Owned |
| :--- | :--- | :--- | :--- |
| **Lead Full-Stack Architect** | System Design, Architecture & Code Quality | • End-to-end architectural roadmap & MVC alignment<br>• Socket.io real-time event protocols<br>• Overall repository structure and documentation standards<br>• API design & cross-tier data synchronization | Node.js, Express, React 18, Socket.io, Git |
| **Frontend & UI/UX Specialist** | Presentation Layer, Glassmorphism & State | • Dark-cinema visual system (Jet Black, Amethyst, Cyan)<br>• Responsive seat map canvas (`SeatMapPage.jsx`)<br>• Authentication modals, OTP input interfaces & toasts<br>• Admin dashboard charts, telemetry cards & catalog tables | React 18, Vite, Bootstrap 5, FontAwesome, CSS3 Variables |
| **Backend & Database Engineer** | Persistence, Business Logic & Seeding | • Mongoose schemas (`Movie`, `Theatre`, `Show`, `Booking`)<br>• Bulk showtime auto-generation engine (`showHelper.js`)<br>• Automated database self-healing seeder (`autoSeeder.js`)<br>• Seed scripts (`seed.js`) & one-click Atlas migration tool | MongoDB, Mongoose, Node-Cron, Express Router |
| **Payment & Integrations Lead** | Payments, Transactional Emails & Webhooks | • Secure Razorpay order creation & HMAC-SHA256 verification<br>• Brevo (Sendinblue) transactional email engine<br>• 6-digit OTP verification & password recovery workflows<br>• TMDB global cinema API integration & live catalog syncing | Razorpay SDK, Brevo SDK, Axios, Crypto, TMDB API |
| **DevOps, Security & QA Engineer** | Infrastructure, Deployment, Auth & Compliance | • Production deployment on Render (backend) & Vercel (frontend)<br>• Vercel SPA routing rewrites (`vercel.json`)<br>• Dynamic multi-origin CORS engine & preflight handlers<br>• JWT security, bcryptjs password hashing & credentials isolation | Vercel, Render, JWT, bcryptjs, Dotenv, npm |

---

## 🎯 Detailed Role Descriptions

### 1. Lead Full-Stack Architect
- Coordinates integration between the React SPA and the Node.js Express server.
- Establishes conventions for error handling, HTTP response formats, and state management.
- Designs the WebSocket room topology (`join-show`, `lock-seats`, `release-seats`, `seat-status-update`) to ensure concurrent booking safety.

### 2. Frontend & UI/UX Specialist
- Translates the cinema theme into reusable, accessible components (`MovieCard`, `Header`, `Footer`, `Loader`, `AdminSidebar`).
- Implements interactive user workflows: multi-criteria catalog search, date carousels, and 3-tier visual seating maps with 10-minute lock countdown timers.
- Optimizes bundle sizes through code splitting (`React.lazy()`) and asset tree shaking with Vite.

### 3. Backend & Database Engineer
- Develops RESTful API controllers with comprehensive input validation.
- Structures MongoDB collections with compound indexing (e.g. `{ userEmail: 1, movieId: 1 }` on reviews and favorites) to guarantee data integrity.
- Designs automated cron services:
  - `cleanupService`: Runs every 2 minutes to free expired seat reservations.
  - `reminderService`: Runs every hour to notify users 24 hours prior to movie showtimes.

### 4. Payment & Integrations Lead
- Implements server-side payment security: ensures secret keys remain strictly on the backend while client-side checkout consumes only public credentials.
- Designs the Brevo transactional email suite:
  - Welcome & 6-digit OTP verification emails.
  - Password recovery emails with 30-minute crypto tokens.
  - Branded HTML electronic tickets with booking reference and payment ID.
- Manages the TMDB REST service, enabling admins to search global movies and auto-fill complete metadata with a single click.

### 5. DevOps, Security & QA Engineer
- Manages multi-cloud hosting pipelines:
  - Configures **Render** for Node.js backend services and production dependency trees.
  - Configures **Vercel** for the Vite React frontend, adding deep link rewrites to eliminate 404 errors.
- Enforces security best practices: validates environment variable boundaries, applies strict CORS policies, and ensures `.env` files are never tracked in version control.
