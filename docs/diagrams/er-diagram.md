# 📊 Entity-Relationship (ER) Diagram

This document models the relational entity structures and cardinality constraints across MongoDB collections in the **iMovies** platform.

---

## 📐 Mermaid.js ER Diagram

```mermaid
erDiagram
    USER ||--o{ BOOKING : places
    USER ||--o{ FAVORITE : saves
    USER ||--o{ REVIEW : writes
    MOVIE ||--o{ SHOW : scheduled_for
    MOVIE ||--o{ FAVORITE : marked_as
    MOVIE ||--o{ REVIEW : receives
    THEATRE ||--o{ SHOW : hosts
    SHOW ||--o{ BOOKING : contains
    ADMIN ||--o{ SHOW : manages

    USER {
        ObjectId _id PK
        string username
        string email
        string password
        boolean isVerified
        string verificationToken
        date verificationTokenExpires
        string verificationOtp
        date verificationOtpExpires
        string resetPasswordToken
        date resetPasswordExpires
        date createdAt
        date updatedAt
    }

    ADMIN {
        ObjectId _id PK
        string username
        string email
        string password
        date createdAt
        date updatedAt
    }

    THEATRE {
        ObjectId _id PK
        string theatreId UK
        string theatreName
        string location
        number balconySeatPrice
        number middleSeatPrice
        number lowerSeatPrice
        object balconySeats
        object middleSeats
        object lowerSeats
        boolean isActive
        date createdAt
        date updatedAt
    }

    MOVIE {
        ObjectId _id PK
        number tmdbId UK
        string movieName
        string description
        array genres
        date releaseDate
        string language
        string duration
        string certification
        string posterUrl
        string trailerUrl
        array cast
        number avgRating
        boolean isActive
        date createdAt
        date updatedAt
    }

    SHOW {
        ObjectId _id PK
        string showId UK
        string adminEmail
        string movieId FK
        string theatreId FK
        string theatreName
        string showDate
        string showTime
        object tickets
        date createdAt
        date updatedAt
    }

    BOOKING {
        ObjectId _id PK
        string bookingId UK
        string userEmail FK
        string showId FK
        string movieId FK
        string theatreName
        string showDate
        string showTime
        array selectedSeats
        number totalAmount
        string paymentStatus
        string razorpayOrderId
        string razorpayPaymentId
        string razorpaySignature
        boolean reminderSent
        date createdAt
        date updatedAt
    }

    REVIEW {
        ObjectId _id PK
        string userEmail FK
        string movieId FK
        string username
        number rating
        string reviewText
        date createdAt
        date updatedAt
    }

    FAVORITE {
        ObjectId _id PK
        string userEmail FK
        string movieId FK
        date createdAt
        date updatedAt
    }
```

---

## 🧩 Schema Relationships & Structural Details

### 1. `USER` & `ADMIN`
- **Separation of Concerns**: Customers register in the `User` schema with automated email verification and OTP tokens. Platform administrators authenticate via the `Admin` schema or fallback verification, receiving elevated JSON Web Tokens (`isAdmin: true`).
- **Security**: Passwords in both collections are salted and hashed with **bcryptjs** (10 salt rounds).

### 2. `THEATRE` & `SHOW`
- **Dynamic Tiering**: The `Theatre` collection stores granular seat map objects (`balconySeats`, `middleSeats`, `lowerSeats`), where each key represents a physical coordinate (e.g., `A1`, `B5`, `F12`).
- **Screening Snapshot**: When a `Show` is initialized, it clones the theatre's seat architecture into a stateful `tickets` dictionary tracking real-time status: `'available'`, `'locked'`, or `'booked'`.

### 3. `MOVIE`, `SHOW`, & `BOOKING`
- **Cardinality**: A single `Movie` has many `Show` schedules distributed across multiple `Theatres`.
- **Atomic Locking & Booking**: A `Booking` aggregates chosen seat labels (`selectedSeats`), calculates billing, and establishes a bidirectional lock lifecycle with automated 10-minute expiry.

### 4. `REVIEW` & `FAVORITE`
- **Compound Uniqueness**: Both collections utilize compound indexing (`{ userEmail: 1, movieId: 1 }`) to ensure a user can only review and favorite a given movie once without duplicate records.
