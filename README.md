# 🚀 AI Job Tracker

An AI-powered, full-stack **Job Application & Search Platform** built with **FastAPI**, **React (Vite)**, **TailwindCSS**, and **Supabase (PostgreSQL)**. 

AI Job Tracker helps job seekers search live opportunities, automatically extract applications from incoming emails, manage job applications, and analyze resumes with ATS optimization.

---

## 🌟 Key Features

### 🔍 1. AI Job Search Module (`/job-search`)
* **Real-time Live Job Search:** Integrated with **RapidAPI JSearch API** to search millions of job listings across LinkedIn, Indeed, Glassdoor, and company portals.
* **Smart Search & Filters:** Filter by Job Title, Location (Remote, Hybrid, Onsite), Experience Level (Entry, Mid, Senior, Lead), Employment Type (Full Time, Part Time, Contract, Internship), and Salary.
* **Glassmorphism Job Cards:** Visual cards displaying company logos, salaries, posted dates, and source badges.
* **Supabase Job Bookmarking:** Save and bookmark jobs stored directly in your **Supabase PostgreSQL** `saved_jobs` table.
* **Recent Search Logs:** Persistent search query chips stored in `recent_searches` table.
* **Job Details Modal:** Inspect full job descriptions, required skills, responsibilities, and perks.
* **Auto-Application Tracking:** Apply to any job URL, confirm *"Did you apply?"*, and the system automatically logs a new entry in your **Applications** board under `APPLIED` status.

---

### 📥 2. Master-Detail Notification Center (`/notifications`)
* **5:7 Split View:** Left scrollable email list + right sticky full email reader.
* **Job-Related Email Filter (`isJobRelatedEmail`):** Automated filtering that discards marketing/spam and displays ONLY job application confirmations, interview invitations, recruiter emails, offers, and rejections.
* **Full Body Formatting:** Multi-line text formatting preserving line breaks and clickable links without truncation.

---

### 💼 3. Applications Board (`/applications`)
* Track all active applications across stages (`Wishlist`, `Applied`, `Interviewing`, `Offered`, `Rejected`).
* Automatically synced from Gmail job emails and AI Job Search applies.
* Real-time search, status filtering, and application details view.

---

### 🤖 4. AI Email Parser & Gmail Sync
* Connect your Gmail account via OAuth / API.
* Automatically parses incoming emails for Company Name, Job Role, Location, and Application Status.

---

### 📄 5. AI Resume ATS (`/resume`)
* Upload resumes (PDF/DOCX) for AI parsing.
* Keyword density score and ATS optimization feedback against target job descriptions.

---

## 🛠️ Tech Stack

### Frontend (`/job-tracker`)
* **Framework:** React 18 (Vite)
* **Styling:** TailwindCSS + Framer Motion (Glassmorphism & animations)
* **Routing:** React Router DOM v6
* **Icons:** Lucide React
* **HTTP Client:** Axios with JWT auto-refresh interceptors
* **Auth:** Supabase Auth SDK

### Backend (`/backend`)
* **Framework:** FastAPI (Async Python)
* **ORM & Database:** SQLAlchemy (Async) + PostgreSQL (Supabase) / SQLite
* **Authentication:** JWT Bearer & Supabase Google OAuth
* **External APIs:** RapidAPI JSearch API, Gmail API

---

## 📁 Project Structure

```text
AI-jobtracker/
├── backend/                  # FastAPI Backend Server
│   ├── app/
│   │   ├── api/v1/endpoints/ # API routers (jobs, applications, gmail, etc.)
│   │   ├── core/            # App configuration & JWT auth
│   │   ├── db/              # Database session & models base
│   │   ├── models/          # SQLAlchemy DB models (user, job, saved_job, search)
│   │   ├── repositories/    # Database repository layer
│   │   ├── schemas/         # Pydantic validation schemas
│   │   └── services/        # Business logic & JSearch API integration
│   └── .env                 # Backend environment variables
└── job-tracker/              # React Frontend Application
    ├── src/
    │   ├── components/      # UI components (SearchBar, JobCard, Sidebar, etc.)
    │   ├── context/         # React Context (AuthContext, JobTrackerContext)
    │   ├── pages/           # Page views (Dashboard, JobSearch, Applications, etc.)
    │   ├── routes/          # Protected AppRoutes
    │   └── services/        # Axios API clients
    └── .env                 # Frontend environment variables
```

---

## 🚀 Getting Started

### 1. Backend Setup

```bash
cd backend
python -m venv venv
# On Windows:
venv\Scripts\activate

pip install -r requirements.txt
```

Create `backend/.env` file:

```env
PROJECT_NAME="CareerTrack Backend"
API_V1_STR=/api/v1
SECRET_KEY=your_secret_key_here

# Database
USE_SQLITE=true
DATABASE_URL=postgresql+asyncpg://postgres:password@db.supabase.co:5432/postgres

# RapidAPI JSearch
RAPIDAPI_KEY=your_rapidapi_jsearch_key
JSEARCH_API_KEY=your_rapidapi_jsearch_key
```

Run backend dev server:

```bash
py -m uvicorn app.main:app --reload
```
Backend API docs available at: `http://localhost:8000/docs`

---

### 2. Frontend Setup

```bash
cd job-tracker
npm install
```

Create `job-tracker/.env` file:

```env
VITE_API_BASE_URL=http://localhost:8000/api/v1
VITE_SUPABASE_URL=https://your-supabase-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_key
```

Run frontend dev server:

```bash
npm run dev
```
Frontend Web App available at: `http://localhost:5173`

---

## 🔑 Environment Variables Summary

| Scope | Variable | Description |
| :--- | :--- | :--- |
| **Backend** | `RAPIDAPI_KEY` | RapidAPI JSearch API Key for live job search |
| **Backend** | `DATABASE_URL` | Supabase PostgreSQL Connection String |
| **Backend** | `USE_SQLITE` | Set `true` for local development mode |
| **Frontend**| `VITE_SUPABASE_URL` | Supabase Project URL |
| **Frontend**| `VITE_SUPABASE_PUBLISHABLE_KEY` | Supabase Anonymous Client Key |

---

## 📜 License

Distributed under the MIT License.
