# 🚀 AI Job Tracker

An AI-powered job application management platform that helps job seekers search for jobs, track applications, manage recruiter emails, optimise resumes, and stay organised throughout the job hunt.

Built with **React**, **FastAPI**, **Supabase**, **Tailwind CSS**, and **Vite**.

---

## 📸 Preview

> Add screenshots or GIFs here

| Dashboard | Job Search |
|-----------|------------|
| ![](docs/dashboard.png) | ![](docs/job-search.png) |

---

## ✨ Features

### 🏠 Dashboard
- Application statistics and progress overview
- Daily goals and activity tracking
- Quick navigation to all modules

---

### 🔍 AI Job Search
Search live jobs from multiple sources through the JSearch API.

#### Features

- Search by job title
- Search by location
- Filter by:
  - Remote
  - Hybrid
  - Onsite
  - Full-Time
  - Part-Time
  - Internship
- View complete job details
- Save jobs to bookmarks
- Apply directly through the original application link
- Automatically create an application entry after applying

---

### 💼 Applications
Track every job application in one place.

Features include:

- Add applications manually
- Auto-create applications from Job Search
- Auto-sync applications detected from Gmail
- Update application status
- Track application timeline
- Search and filter applications

---

### 📥 Smart Inbox
A dedicated inbox for job-related emails.

Features include:

- Gmail integration
- Automatic job email detection
- Ignore newsletters and promotional emails
- Master-detail email reader
- Read full email content
- Clickable links
- Recruiter communication history

---

### 📄 AI Resume ATS
Resume optimisation tool.

Features

- Resume upload
- ATS keyword analysis
- Resume parsing
- Keyword recommendations
- Match improvement suggestions

---

### ⚙️ Settings
Manage your account and integrations.

- Google Authentication
- Gmail API connection
- Profile settings
- API configuration

---

## 🛠 Tech Stack

### Frontend

- React
- Vite
- Tailwind CSS
- React Router
- Axios
- Framer Motion
- Lucide Icons
- Supabase Auth

### Backend

- FastAPI
- SQLAlchemy
- Pydantic
- PostgreSQL (Supabase)
- SQLite (Development)
- Gmail API

### Authentication

- Supabase Authentication
- Google OAuth

### Database

- Supabase PostgreSQL
- SQLite (Local Development)

---

## 📂 Project Structure

```
AI-Job-Tracker/

├── backend/
│   ├── app/
│   │   ├── api/
│   │   ├── models/
│   │   ├── repositories/
│   │   ├── services/
│   │   ├── schemas/
│   │   └── main.py
│   │
│   └── requirements.txt
│
├── job-tracker/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── context/
│   │   ├── hooks/
│   │   └── services/
│   │
│   └── package.json
│
└── README.md
```

---

## 🚀 Getting Started

### 1. Clone Repository

```bash
git clone https://github.com/yourusername/AI-Job-Tracker.git

cd AI-Job-Tracker
```

---

## Backend Setup

### Create Virtual Environment

```bash
python -m venv venv
```

Activate

Windows

```bash
venv\Scripts\activate
```

Linux/macOS

```bash
source venv/bin/activate
```

Install dependencies

```bash
pip install -r requirements.txt
```

Create `.env`

```env
USE_SQLITE=true

DATABASE_URL=

SUPABASE_URL=

SUPABASE_KEY=

GOOGLE_CLIENT_ID=

GOOGLE_CLIENT_SECRET=

RAPIDAPI_KEY=
```

Run backend

```bash
uvicorn app.main:app --reload
```

Backend

```
http://localhost:8000
```

API Docs

```
http://localhost:8000/docs
```

---

## Frontend Setup

Install packages

```bash
npm install
```

Create `.env`

```env
VITE_API_URL=http://localhost:8000

VITE_SUPABASE_URL=

VITE_SUPABASE_PUBLISHABLE_KEY=
```

Run

```bash
npm run dev
```

Frontend

```
http://localhost:5173
```

---

## 📦 Available Scripts

### Frontend

```bash
npm run dev
```

Start development server

```bash
npm run build
```

Production build

```bash
npm run preview
```

Preview production build

---

### Backend

```bash
uvicorn app.main:app --reload
```

Start FastAPI server

---

## 🌟 Key Modules

| Module | Description |
|---------|-------------|
| Dashboard | Job search overview |
| AI Job Search | Search and bookmark live jobs |
| Applications | Manage application pipeline |
| Inbox | Gmail job email reader |
| Resume ATS | Resume analysis |
| Settings | Authentication & integrations |

---

## 🔮 Roadmap

Planned features

- AI Job Matching
- Resume-to-Job Match Score
- AI Interview Preparation
- AI Cover Letter Generator
- AI Career Coach
- AI Skill Gap Analysis
- Job Recommendation Engine
- Saved Search Alerts
- Chrome Extension
- Calendar Integration

---

## 🤝 Contributing

Contributions are welcome.

1. Fork the repository
2. Create a new feature branch

```bash
git checkout -b feature/new-feature
```

3. Commit your changes

```bash
git commit -m "Add new feature"
```

4. Push your branch

```bash
git push origin feature/new-feature
```

5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License.

---

## 👩‍💻 Author

**Rishika Bangwal**

- GitHub: https://github.com/rishika553
- LinkedIn: https://linkedin.com/in/rishika-bangwal-a12821320

---

⭐ If you found this project useful, consider giving it a star!