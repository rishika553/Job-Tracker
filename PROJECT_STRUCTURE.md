#  AI Job Tracker - Project Structure & Technical Architecture Document

##  Executive Summary

**AI Job Tracker** is a modern, full-stack, AI-powered **Job Application, Search & Email Automation Platform**. It addresses the friction job seekers face when managing applications across multiple job portals, tracking response statuses, analyzing resume ATS alignment, and managing recruiter communications.

Built with **FastAPI (Async Python)** on the backend and **React 18 (Vite + TailwindCSS + Framer Motion)** on the frontend, the platform integrates with external APIs (**RapidAPI JSearch**, **Google Gmail API via OAuth 2.0**) and supports dual database persistence (**PostgreSQL via Supabase** for cloud production and **SQLite** for local development).

---

## 🎯 Problem Statement & Solution

### 1. The Problem
* **Fragmented Job Search:** Job seekers apply across dozens of platforms (LinkedIn, Indeed, Glassdoor, company career portals), making it difficult to keep track of where and when they applied.
* **Email Inbox Clutter:** Application confirmations, interview invites, online assessments, and rejection letters get lost among promotional emails and newsletter spam.
* **Manual Tracking Overhead:** Manually updating Excel sheets or Trello boards with application dates, job descriptions, contact details, and follow-up deadlines is tedious and prone to human error.
* **ATS Black Hole:** Resumes submitted without keyword optimization often get screened out by Applicant Tracking Systems (ATS) without candidate feedback.

### 2. The Solution
**AI Job Tracker** provides a centralized, automated hub:
1. **Live AI Job Search (`/job-search`):** Real-time aggregation of job listings via RapidAPI JSearch with search filters, bookmarking (`saved_jobs`), search logs (`recent_searches`), and 1-click application tracking.
2. **Automated Gmail Sync & AI Email Parser (`/gmail`, `/notifications`):** Secure OAuth 2.0 Gmail integration that automatically fetches incoming emails, classifies them (`is_job_related`), and parses key details (Company, Role, Application Status) into application records.
3. **Master-Detail Email Center (`/notifications`):** A split-screen inbox specifically for job-related emails with full-text viewing and clickable links.
4. **Kanban Application Board (`/applications`):** Visual tracking of application stages (`Wishlist`, `Applied`, `Interviewing`, `Offered`, `Rejected`, `Assessment`, `Accepted`, `Withdrawn`).
5. **AI Resume ATS Analyzer (`/resume`):** PDF/DOCX resume text extraction, keyword density analysis, and job description alignment scoring.
6. **Analytics & Interview Calendar (`/analytics`, `/calendar`):** Visual metrics, response rates, conversion funnels, and scheduled interview event management.

---

## 🏛️ High-Level System Architecture

```mermaid
graph TD
    subgraph Client ["Frontend (React 18 + Vite)"]
        UI[User Interface / Pages]
        CTX[React Context: AuthContext & JobTrackerContext]
        API_CLIENT[Axios Client with Interceptors]
        UI --> CTX
        CTX --> API_CLIENT
    end

    subgraph Backend ["Backend (FastAPI Async Python)"]
        ROUTER[API Router /api/v1]
        MW[Middlewares: CORS, Request ID, Error Handler]
        SERVICES[Service Layer: JSearch, Gmail, AI Parser, ATS]
        REPOS[Repository Layer: SQLAlchemy Async ORM]
        SCHEDULER[APScheduler: Periodic Email Sync]
        
        MW --> ROUTER
        ROUTER --> SERVICES
        SERVICES --> REPOS
        SCHEDULER --> SERVICES
    end

    subgraph External ["External Services & Data Storage"]
        DB[(Database: Supabase PostgreSQL / SQLite)]
        JSEARCH[RapidAPI JSearch API]
        GMAIL_API[Google Gmail API]
    end

    API_CLIENT --> MW
    REPOS --> DB
    SERVICES --> JSEARCH
    SERVICES --> GMAIL_API
```

---

## 🗄️ Database Architecture & Schema Reference

The system uses SQLAlchemy 2.0 (Async) with portable data types (`PortableUUID` and `PortableJSON`) enabling seamless execution on both **SQLite** (local development) and **PostgreSQL/Supabase** (cloud deployment).

### 1. Entity-Relationship Diagram (ERD)

```mermaid
erDiagram
    users ||--o{ job_applications : "owns"
    users ||--o{ connected_gmail_accounts : "connects"
    users ||--o{ resumes : "uploads"
    users ||--o{ recruiters : "manages"
    users ||--o{ notifications : "receives"
    users ||--o{ activity_logs : "generates"
    users ||--o{ email_messages : "receives"
    users ||--o{ refresh_tokens : "has"
    users ||--o{ saved_jobs : "bookmarks"
    users ||--o{ recent_searches : "logs"

    companies ||--o{ job_applications : "has"
    resumes ||--o{ job_applications : "used_in"

    job_applications ||--o{ recruiters : "contacts"
    job_applications ||--o{ interviews : "schedules"
    job_applications ||--o{ application_timeline : "tracks_history"
    job_applications ||--o{ email_messages : "associated_with"
```

### 2. Primary Tables & Attributes

| Table Name | Primary Key | Description & Foreign Keys | Key Attributes |
| :--- | :--- | :--- | :--- |
| `users` | `id` (UUID) | System user profile & credentials | `email`, `hashed_password`, `full_name`, `google_id`, `is_active`, `is_superuser` |
| `job_applications` | `id` (UUID) | Core job application records (`FK: user_id`, `FK: company_id`, `FK: resume_id`) | `title`, `status`, `applied_at`, `location`, `salary_range`, `job_description`, `source` |
| `companies` | `id` (UUID) | Company profiles | `name`, `domain`, `logo_url`, `location`, `website` |
| `recruiters` | `id` (UUID) | Recruiter contact details (`FK: user_id`, `FK: job_application_id`, `FK: company_id`) | `name`, `email`, `phone`, `role`, `notes` |
| `interviews` | `id` (UUID) | Scheduled interview rounds (`FK: job_application_id`) | `interview_type`, `scheduled_at`, `location_or_link`, `status`, `notes` |
| `email_messages` | `id` (UUID) | Incoming emails from Gmail (`FK: user_id`, `FK: job_application_id`) | `sender`, `recipient`, `subject`, `body`, `is_job_related`, `ai_analysis_status` |
| `connected_gmail_accounts`| `id` (UUID) | User OAuth Gmail sync state (`FK: user_id`) | `email_address`, `access_token`, `refresh_token`, `sync_status`, `last_synced_at` |
| `resumes` | `id` (UUID) | Uploaded resume files & ATS analyses (`FK: user_id`) | `file_name`, `file_path`, `parsed_text`, `skills_extracted`, `ats_score` |
| `saved_jobs` | `id` (UUID) | Bookmarked job search items (`FK: user_id`) | `job_id`, `title`, `company`, `location`, `salary`, `job_url`, `source` |
| `recent_searches` | `id` (UUID) | Search query history logs (`FK: user_id`) | `query`, `location`, `filters`, `searched_at` |
| `notifications` | `id` (UUID) | Alert notifications (`FK: user_id`, `FK: job_application_id`) | `type`, `title`, `message`, `is_read` |
| `activity_logs` | `id` (UUID) | User activity audit trail (`FK: user_id`) | `action`, `entity_type`, `entity_id`, `timestamp` |
| `application_timeline` | `id` (UUID) | Stage change audit log (`FK: job_application_id`) | `previous_status`, `new_status`, `notes`, `created_at` |
| `refresh_tokens` | `id` (UUID) | Auth session tokens (`FK: user_id`) | `token`, `expires_at`, `is_revoked` |

### 3. Key Enumerations (`app/models/enums.py`)
* `ApplicationStatus`: `APPLIED`, `INTERVIEWING`, `OFFERED`, `REJECTED`, `ASSESSMENT`, `ACCEPTED`, `WITHDRAWN`
* `AIAnalysisStatus`: `PENDING`, `SUCCESS`, `FAILED`, `IGNORED`
* `NotificationType`: `INTERVIEW_INVITATION`, `OFFER`, `REJECTION`, `UPCOMING_INTERVIEW`, `ASSESSMENT_DEADLINE`, `FOLLOWUP_REMINDER`, `JOB_DETECTED`
* `InterviewType`: `PHONE`, `TECHNICAL`, `ONSITE`, `BEHAVIORAL`

---

## 📁 Repository Directory Structure

```text
AI-jobtracker/
├── README.md                      # Primary project quickstart & configuration guide
├── PROJECT_STRUCTURE.md           # Technical Architecture & Structural Documentation (This file)
├── backend/                       # Async FastAPI Server Application
│   ├── alembic.ini                # Alembic database migration configuration
│   ├── requirements.txt           # Python dependencies (FastAPI, SQLAlchemy, Pydantic, etc.)
│   ├── careertrack.db             # Local SQLite development database instance
│   └── app/
│       ├── main.py                # App entry point, CORS, Middlewares & Lifespan context
│       ├── api/
│       │   └── v1/
│       │       ├── api.py         # Main V1 API Router aggregation
│       │       └── endpoints/     # Feature-specific route handlers
│       │           ├── analytics.py
│       │           ├── applications.py
│       │           ├── auth.py
│       │           ├── calendar.py
│       │           ├── companies.py
│       │           ├── dashboard.py
│       │           ├── gmail.py
│       │           ├── jobs.py
│       │           ├── notifications.py
│       │           └── resume.py
│       ├── core/                  # Core configurations, JWT security & HTTP clients
│       │   ├── config.py          # Environment settings & credentials
│       │   ├── security.py        # Password hashing & JWT token handling
│       │   ├── logging.py         # Structured logging configuration
│       │   └── http_client.py     # Shared Async HTTP Client session
│       ├── db/                    # Database engine & session initialization
│       │   ├── base_class.py      # SQLAlchemy Base model
│       │   ├── session.py         # Async Session Maker & engine creation
│       │   ├── init_db.py         # Initial DB table creation helper
│       │   └── types.py           # Portable UUID & JSON DB field variants
│       ├── jobs/                  # Background task schedulers
│       │   └── scheduler.py       # APScheduler setup for periodic email sync
│       ├── middleware/            # Custom FastAPI request middleware
│       │   ├── error_handler.py   # Global exception handling & standard responses
│       │   └── request_id.py      # Correlation request ID injection
│       ├── models/                # SQLAlchemy ORM Database Domain Models
│       ├── repositories/          # Data Access Layer (SQLAlchemy Async Queries)
│       ├── schemas/               # Pydantic Request & Response validation models
│       └── services/              # Business Logic (JSearch API, Gmail, AI Parser, ATS)
│
└── job-tracker/                   # Frontend Web Application (React 18 + Vite)
    ├── package.json               # NPM dependencies (React Router, Tailwind, Framer Motion, Lucide)
    ├── vite.config.js             # Vite configuration & dev server options
    ├── index.html                 # Main HTML entry point
    └── src/
        ├── main.jsx               # React Application Root mounting point
        ├── App.jsx                # Router setup & Context Provider wrapping
        ├── index.css              # Global styles, Tailwind directives & CSS variables
        ├── components/            # Reusable UI components (Sidebar, SearchBar, JobCard, etc.)
        ├── context/               # React Context Providers
        │   ├── AuthContext.jsx    # User authentication & session state
        │   └── JobTrackerContext.jsx # Global application board & job state
        ├── layouts/               # Page wrapper layouts (Sidebar + Header layout)
        ├── pages/                 # Full Page Views
        │   ├── AIInsights.jsx     # AI career advice & insights dashboard
        │   ├── Analytics.jsx      # Conversion rates & application analytics
        │   ├── Application.jsx    # Applications Kanban board & table list
        │   ├── ApplicationDetails.jsx # Detailed single-application inspector
        │   ├── Calendar.jsx       # Interview calendar & schedule manager
        │   ├── Companies.jsx      # Target companies management page
        │   ├── Dashboard.jsx      # Main executive dashboard
        │   ├── JobSearch.jsx      # Real-time JSearch API job search hub
        │   ├── Login.jsx          # Authentication login/registration page
        │   ├── Notifications.jsx  # Master-detail job email & notifications center
        │   ├── Pipeline.jsx       # Application pipeline visual view
        │   ├── Resume.jsx         # ATS resume upload & analysis scanner
        │   └── Setting.jsx        # Account settings & Gmail connection page
        ├── routes/                # Protected Router & Public Route definitions
        └── services/              # API Client modules using Axios
            ├── api.js             # Base Axios instance with Bearer token interceptor
            ├── applicationsApi.js
            ├── authApi.js
            ├── calendarApi.js
            ├── companiesApi.js
            ├── dashboardApi.js
            ├── gmailApi.js
            ├── jobsApi.js
            ├── notificationsApi.js
            └── resumeApi.js
```

---

## ⚡ Technical Component Deep Dive

### 1. Backend Core Architecture (`/backend/app`)

#### A. Entry Point & Middleware Chain (`main.py`)
FastAPI application execution flows through an explicit middleware stack and lifespan context manager:
* **Lifespan Manager:** On application startup, `init_db()` runs table creation/verification and `scheduler.start()` starts the background email synchronization engine. On shutdown, connection pools and HTTP clients are gracefully closed.
* **Middleware Execution Order:**
  1. `CORSMiddleware`: Dynamically allows development origins (`localhost:5173`, `localhost:3000`, etc.) and production domains.
  2. `RequestIdMiddleware`: Generates and attaches a unique correlation ID (`X-Request-ID`) to each incoming HTTP request for tracing.
  3. `ErrorHandlerMiddleware`: Intercepts unhandled runtime exceptions and returns formatted standard JSON error responses.

#### B. API Endpoints (`/api/v1/endpoints`)
* `auth.py`: User registration (`/register`), JWT token generation (`/login`), refresh token rotation (`/refresh`), and Google OAuth token verification (`/google`).
* `jobs.py`: Interacts with JSearch API (`/search`), manages saved job bookmarks (`/saved`), and maintains query history (`/recent-searches`).
* `applications.py`: CRUD routes for applications (`GET`, `POST`, `PUT`, `DELETE`), stage transitions, and filtering by status, company, or date.
* `gmail.py`: Handles Google OAuth 2.0 flow (`/connect`), manual email fetch triggers (`/fetch`), and AI extraction triggers (`/parse-emails`).
* `resume.py`: Handles multi-part file upload (`/upload`), extracts raw text from PDF/DOCX files, and computes keyword alignment scores.
* `analytics.py`, `dashboard.py`, `calendar.py`, `notifications.py`, `companies.py`: Data aggregators for frontend views.

---

### 2. Frontend Core Architecture (`/job-tracker/src`)

#### A. Context State Management
* **`AuthContext.jsx`**: Controls user session status, stores JWT bearer tokens in localStorage/sessionStorage, provides `login()`, `logout()`, and `googleLogin()` methods, and manages user identity.
* **`JobTrackerContext.jsx`**: Acts as a central state manager for job applications, bookmarks, search queries, and real-time status updates across components without prop drilling.

#### B. HTTP API Layer (`/services/api.js`)
Axios client setup with automated interceptors:
* **Request Interceptor:** Automatically injects the stored JWT token into the `Authorization: Bearer <token>` header for all outgoing API calls.
* **Response Interceptor:** Intercepts `401 Unauthorized` responses and automatically attempts token refresh before re-trying failed requests or redirecting to `/login`.

---

## 🔄 End-to-End Key Data Flows

### 1. Real-Time Job Search & Application Flow
```text
[User on /job-search] 
    ├── Types Query & Applies Filters
    ├── Request -> GET /api/v1/jobs/search?query=...
    │      └── Backend calls RapidAPI JSearch API -> Returns live job objects
    ├── Click "Bookmark" -> POST /api/v1/jobs/saved -> Inserted into `saved_jobs` table
    └── Click "Apply & Track"
           └── POST /api/v1/applications -> Creates entry in `job_applications` under `APPLIED` status
```

### 2. Gmail Synchronization & AI Email Parsing Flow
```text
[Background Scheduler / User Action]
    ├── Triggers GET /api/v1/gmail/fetch
    ├── Backend queries Gmail API for unread messages with job-related keywords
    ├── Email Service runs AI Email Parser / Classifier
    │      ├── Filters out spam/promotional emails (`is_job_related` boolean)
    │      ├── Extracts: Company Name, Job Title, Stage Update (Interview, Offer, Rejection)
    │      └── Saves message in `email_messages` table
    └── Auto-creates or updates matching `job_applications` record & fires `notifications`
```

---

## 🛠️ Environment Configuration Guide

### 1. Backend Configuration (`backend/.env`)
```env
PROJECT_NAME="CareerTrack Backend"
API_V1_STR=/api/v1
SECRET_KEY=your_super_secret_jwt_key_here
ENV=development

# Database Configuration (PostgreSQL / SQLite)
USE_SQLITE=true
DATABASE_URL=postgresql+asyncpg://postgres:password@db.supabase.co:5432/postgres

# External API Credentials
RAPIDAPI_KEY=your_rapidapi_jsearch_key
JSEARCH_API_KEY=your_rapidapi_jsearch_key
```

### 2. Frontend Configuration (`job-tracker/.env`)
```env
VITE_API_BASE_URL=http://localhost:8000/api/v1
VITE_SUPABASE_URL=https://your-supabase-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_key
```

---

## 🚀 Execution & Quickstart Commands

### Running Backend
```bash
cd backend
python -m venv venv
# Windows activate:
venv\Scripts\activate
pip install -r requirements.txt

# Launch FastAPI with live reload:
python -m uvicorn app.main:app --reload --port 8000
```
* Interactive API Swagger Docs: `http://localhost:8000/docs`

### Running Frontend
```bash
cd job-tracker
npm install
npm run dev
```
* Local Web Application: `http://localhost:5173`
