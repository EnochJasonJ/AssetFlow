# AssetFlow — Enterprise Asset Management System

An enterprise-grade, full-stack **Asset Management System (EAMS)** designed to manage the end-to-end lifecycle of corporate assets—including procurement, registration, allocation, employee transfers, resource bookings, maintenance workflows, and compliance audits.

---

## ✨ Key Features

- **Full Lifecycle Asset Tracking**: Register hardware, software, licenses, and office resources. Track serial numbers, asset tags (`AF-XXXX`), acquisition cost, category, and real-time status (`AVAILABLE`, `ALLOCATED`, `IN_MAINTENANCE`, `RESERVED`, `RETIRED`).
- **Smart Allocations & Transfers**: Assign assets directly to employees or departments using intuitive dropdown selectors. Track return dates, condition notes, and transfer history.
- **Resource Bookings**: Schedule bookable shared assets (e.g., conference rooms, projectors, test benches) with conflict-aware time slots.
- **Maintenance & Ticketing**: Raise maintenance requests with priority levels (`LOW`, `MEDIUM`, `HIGH`, `CRITICAL`), assign technicians, and track resolution timelines.
- **Compliance Audits**: Create structured audit cycles, verify physical asset presence, and record compliance notes.
- **Real-Time Activity Logs & Notifications**: Automated audit trail logging every action across the platform, accompanied by real-time notification alerts for assignments, bookings, and approvals.

---

## 🏛️ Core Architecture & Flow Diagram

### 1. System Architecture

```mermaid
graph TD
    subgraph Client [Frontend Layer — React + Vite]
        UI[App Shell & Layout]
        Pages[Dashboard | Assets | Allocations | Bookings | Maintenance | Audits | Logs]
        Services[API Service Layer / Axios & Fetch]
    end

    subgraph Server [Backend Layer — Node.js + Express]
        API[Express REST API - /api/v1]
        Auth[JWT Authentication & Role RBAC]
        Controllers[Resource Controllers]
        ORM[Prisma ORM]
    end

    subgraph Data [Persistence Layer — PostgreSQL / Supabase]
        DB[(PostgreSQL Database)]
        Realtime[Supabase Realtime / Notifications]
    end

    UI --> Pages
    Pages --> Services
    Services -- "HTTP REST (Bearer Token)" --> API
    API --> Auth
    Auth --> Controllers
    Controllers --> ORM
    ORM --> DB
    Services -. "Realtime WebSocket" .-> Realtime
```

---

### 2. Asset Lifecycle Workflow

```mermaid
stateDiagram-v2
    [*] --> AVAILABLE : Register Asset
    AVAILABLE --> ALLOCATED : Allocate to Employee / Dept
    ALLOCATED --> AVAILABLE : Return Asset
    AVAILABLE --> RESERVED : Book Resource (Time-slotted)
    RESERVED --> AVAILABLE : Booking Completed
    AVAILABLE --> IN_MAINTENANCE : Raise Maintenance Request
    ALLOCATED --> IN_MAINTENANCE : Raise Maintenance Request
    IN_MAINTENANCE --> AVAILABLE : Maintenance Resolved
    AVAILABLE --> RETIRED : Decommission / Dispose
    RETIRED --> [*]
```

---

## 🛠️ Technology Stack

| Layer | Technology | Description |
| :--- | :--- | :--- |
| **Frontend** | React 18 + Vite | Modern single-page application with responsive CSS design tokens |
| **Backend** | Node.js + Express.js | High-performance RESTful API server (`/api/v1`) |
| **Database ORM** | Prisma ORM | Type-safe schema management and database modeling |
| **Database** | PostgreSQL / Supabase | Relational persistence layer with UUID primary keys |
| **Authentication** | JWT + Supabase Auth | Secure role-based access control (`Admin`, `Asset Manager`, `Employee`) |

---

## 🚀 Getting Started & Configuration

### Prerequisites
- **Node.js**: v18.x or higher
- **Package Manager**: `npm`
- **Database**: PostgreSQL (or Supabase Cloud instance)

---

### 1. Backend Configuration (`/backend`)

1. Navigate to the backend directory and install dependencies:
   ```bash
   cd backend
   npm install
   ```

2. Create a `.env` file in `backend/` configured with your database and JWT secret:
   ```env
   PORT=4000
   DATABASE_URL="postgresql://postgres:password@db.your-project.supabase.co:5432/postgres"
   DIRECT_URL="postgresql://postgres:password@db.your-project.supabase.co:5432/postgres"
   JWT_SECRET="your_super_secret_jwt_key_32_chars"
   ```

3. Run database migrations and seed default administrative data:
   ```bash
   npx prisma generate
   npx prisma migrate dev --name init
   npm run seed
   ```

4. Start the backend development server:
   ```bash
   npm run dev
   ```
   *The backend API server will listen on `http://localhost:4000`.*

---

### 2. Frontend Configuration (`/frontend`)

1. Navigate to the frontend directory and install dependencies:
   ```bash
   cd frontend
   npm install
   ```

2. Create a `.env` file in `frontend/`:
   ```env
   VITE_API_BASE_URL=http://localhost:4000/api/v1
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

3. Start the Vite frontend dev server:
   ```bash
   npm run dev
   ```
   *The frontend application will be accessible at `http://localhost:5173`.*

---

## 📚 REST API Endpoints Overview

All REST API routes are prefixed under `/api/v1` and authenticated via `Authorization: Bearer <token>`.

| Endpoint | Methods | Description |
| :--- | :--- | :--- |
| `/api/v1/auth` | `POST` | User login (`/login`), profile registration, and token validation |
| `/api/v1/assets` | `GET`, `POST`, `PUT`, `DELETE` | CRUD operations for assets, filtering by tag, status, or department |
| `/api/v1/allocations` | `GET`, `POST`, `PUT` | Assign assets, return allocated assets, and record condition notes |
| `/api/v1/transfers` | `GET`, `POST`, `PUT` | Request and approve asset transfers between departments/employees |
| `/api/v1/bookings` | `GET`, `POST`, `DELETE` | Schedule time-slotted bookings for shared bookable resources |
| `/api/v1/maintenance` | `GET`, `POST`, `PUT` | Raise maintenance tickets, assign technicians, and resolve issues |
| `/api/v1/audits` | `GET`, `POST`, `PUT` | Manage compliance audit cycles and item verification checkpoints |
| `/api/v1/logs` | `GET` | Fetch system-wide activity audit trail across all entities |
| `/api/v1/notifications` | `GET`, `PUT` | Retrieve user alerts and mark notifications as read |

---

## 📁 Repository Structure

```
AssetFlow/
├── backend/
│   ├── prisma/
│   │   └── schema.prisma         # Complete database schema & models
│   └── src/
│       ├── controllers/          # Business logic for assets, allocations, logs, etc.
│       ├── middlewares/          # JWT authentication & error handling
│       ├── routes/               # Express route definitions (/api/v1/...)
│       └── server.js             # API server entrypoint
├── frontend/
│   └── src/
│       ├── components/           # Reusable UI components & layouts
│       ├── context/              # AuthContext & application state
│       ├── pages/                # Screen views (Dashboard, Assets, Allocations, Logs)
│       └── services/             # API client layer (assets.js, logs.js, etc.)
└── README.md
```

---

## 👥 License & Attribution
Developed for Enterprise Asset Management. All rights reserved.
