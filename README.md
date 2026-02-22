# EduAI — Classroom Assistant

An AI-powered full-stack classroom assistant that automatically transcribes lectures, extracts assignments, and generates study materials.

## 🏗️ Stack
| Layer | Technology |
|---|---|
| Frontend | Next.js 15 (App Router) + TypeScript + TailwindCSS |
| Backend | Python Flask |
| Auth | Firebase (Google Sign-In) |
| Database | Cloud Firestore |
| Storage | Supabase Storage |
| STT | RapidAPI Whisper |
| AI | Google Gemini 2.0 Flash |

---

## 🚀 Quick Start

### 1. Frontend (Next.js)

```bash
# Install dependencies
npm install

# Copy and fill in environment variables
cp .env.example .env

# Run dev server (http://localhost:3000)
npm run dev
```

### 2. Backend (Flask)

```bash
cd backend

# Create virtual environment
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # Mac/Linux

# Install dependencies
pip install -r requirements.txt

# Copy and fill in environment variables
cp .env.example .env

# Run Flask server (http://localhost:5000)
python app.py
```

---

## 🔑 Environment Variables

### Frontend (`.env`)
| Variable | Description |
|---|---|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Firebase Web API key |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Firebase auth domain |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Firebase project ID |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | Firebase storage bucket |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Firebase sender ID |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | Firebase app ID |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key |
| `FIREBASE_SERVICE_ACCOUNT_KEY` | Firebase Admin service account JSON (stringified) |
| `GEMINI_API_KEY` | Google Gemini API key (**server-only**, no NEXT_PUBLIC_) |
| `RAPIDAPI_KEY` | RapidAPI key for Whisper STT |
| `RAPIDAPI_HOST` | RapidAPI Whisper host |
| `FLASK_BACKEND_URL` | URL of the Flask backend (default: http://localhost:5000) |

### Backend (`backend/.env`)
| Variable | Description |
|---|---|
| `FIREBASE_SERVICE_ACCOUNT_KEY` | Firebase Admin service account JSON (stringified) |
| `GEMINI_API_KEY` | Google Gemini API key |
| `RAPIDAPI_KEY` | RapidAPI key |
| `RAPIDAPI_HOST` | RapidAPI Whisper host |
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (for server-side access) |
| `ALLOWED_ORIGINS` | Comma-separated CORS origins (default: http://localhost:3000) |

---

## 📁 Project Structure

```
classroomAssistant/
├── app/                        # Next.js pages (App Router)
│   ├── api/                    # Next.js API routes (Firebase Admin)
│   │   ├── process-lecture/    # POST — STT + Gemini + Firestore
│   │   ├── tasks/approve/      # PUT — approve/reject task
│   │   └── summary/            # GET — lecture summary
│   ├── dashboard/
│   │   ├── teacher/            # Teacher pages
│   │   │   ├── page.tsx        # Overview + pending approvals
│   │   │   ├── record/         # Record / upload lecture
│   │   │   └── lectures/       # Lecture list + [id] detail
│   │   └── student/            # Student pages
│   │       ├── page.tsx        # Dashboard + notifications
│   │       ├── calendar/       # Full assignment calendar
│   │       └── summaries/      # AI summaries + exam notes
│   └── page.tsx                # Landing page
├── components/                 # Shared UI components
│   ├── Header.tsx              # Top bar + dark mode toggle
│   ├── Sidebar.tsx             # Role-based navigation
│   ├── DashboardLayout.tsx     # Layout wrapper + auth guard
│   └── LandingPage.tsx         # Marketing / sign-in page
├── context/
│   └── AuthContext.tsx         # Firebase auth + role state
├── lib/
│   ├── firebase.ts             # Client Firebase init
│   ├── firebase-admin.ts       # Server Firebase Admin init
│   ├── gemini.ts               # Gemini AI helpers
│   └── supabase.ts             # Supabase client
└── backend/                    # Python Flask API
    ├── app.py                  # App factory + CORS + blueprints
    ├── requirements.txt
    ├── routes/
    │   ├── auth.py             # POST /verify-token
    │   ├── lecture.py          # POST /process-lecture, GET /lectures/<id>
    │   ├── tasks.py            # GET /tasks/<uid>, PUT /tasks/approve/<id>
    │   └── summary.py          # GET /summary/<lectureId>
    └── services/
        ├── firebase_service.py # Token verification
        ├── firestore_service.py# Firestore CRUD
        ├── stt_service.py      # RapidAPI Whisper
        ├── gemini_service.py   # Gemini extraction
        └── supabase_service.py # Signed URL helpers
```

---

## 🔔 Architecture Notes

- **Dual backend**: Next.js API routes handle server tasks when deployed on Vercel (Firebase Admin is available via env vars). The Flask backend is an optional parallel backend for custom Python logic. The frontend proxies `/api/flask/*` → Flask via `next.config.ts` rewrites.
- **Auth flow**: Google Sign-In → Firebase ID token → sent as `Authorization: Bearer <token>` → verified by either Next.js API routes (via `firebase-admin`) or Flask backend.
- **Real-time**: All dashboard data uses Firestore `onSnapshot` listeners for instant updates.

---

## 🚢 Deployment

| Service | Platform |
|---|---|
| Frontend | Vercel |
| Flask Backend | Render / Railway |
| Database | Firebase Firestore |
| Storage | Supabase |

Set `FLASK_BACKEND_URL` in Vercel environment variables to your Render deployment URL.
