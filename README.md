<div align="center">

# 🏥 WellPoint

**A Next-Generation Healthcare Management Platform**

[![React](https://img.shields.io/badge/React-18-blue.svg?style=for-the-badge&logo=react)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.0-38B2AC.svg?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
[![Spring Boot](https://img.shields.io/badge/Spring_Boot-3.3-6DB33F.svg?style=for-the-badge&logo=spring-boot)](https://spring.io/projects/spring-boot)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Supabase-336791.svg?style=for-the-badge&logo=postgresql)](https://supabase.com/)
[![Gemini AI](https://img.shields.io/badge/AI-Google_Gemini-FF6F00.svg?style=for-the-badge&logo=google)](https://deepmind.google/technologies/gemini/)

*WellPoint is a comprehensive, beautifully designed clinic management system that bridges the gap between patients, doctors, and administrators using modern web technologies and AI.*

[Explore Features](#sparkles-key-features) • [Installation](#gear-installation--setup) • [Architecture](#triangular_ruler-architecture) • [Screenshots](#camera-gallery)

</div>

---

## 🌟 Vision

WellPoint was designed with a **"classy, clinical-modern, and calm"** aesthetic. The goal is to provide a trustworthy, dynamic, and frictionless experience for healthcare professionals and patients alike. By integrating Google Gemini AI and Google Calendar, WellPoint reduces administrative overhead, allowing doctors to focus entirely on patient care.

---

## :sparkles: Key Features

### 👨‍⚕️ For Doctors
- **Smart Dashboard:** A beautifully animated, Framer Motion-powered dashboard to view daily schedules at a glance.
- **AI Post-Visit Notes:** Leverage Google Gemini AI to automatically generate, summarize, and format patient visit notes and prescriptions.
- **Google Calendar Sync:** Two-way synchronization with Google Calendar so doctors never miss an appointment.
- **Leave Management:** Mark unavailability to automatically block booking slots for patients.

### 🤒 For Patients
- **Frictionless Booking:** Search for doctors by specialization, view real-time availability, and book appointments instantly.
- **Appointment History:** Track upcoming and past visits, and securely view doctor's notes and prescriptions.
- **Dynamic UI:** Smooth, responsive interfaces with micro-animations that make navigation a breeze.

### 🛡️ For Administrators
- **Staff Management:** Create, update, and manage doctor profiles and system access.
- **System Monitoring:** Monitor automated AI summaries and email notification logs in real-time.
- **Leave Approvals:** Oversee and manage doctor schedules and clinic capacity.

---

## :camera: Gallery

*(Paste your screenshots below!)*

<div align="center">

<img src="docs/screenshots/landing-page.png" width="800" alt="WellPoint Landing Page" style="border-radius: 8px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);" />

<br/><br/>

| Patient Dashboard | Doctor Appointments |
| :---: | :---: |
| <img src="docs/screenshots/patient-dashboard.png" width="400" alt="Patient Dashboard Placeholder" /> | <img src="docs/screenshots/doctor-appointments.png" width="400" alt="Doctor Appointments Placeholder" /> |

| AI Post-Visit Notes | Admin Portal |
| :---: | :---: |
| <img src="docs/screenshots/ai-notes.png" width="400" alt="AI Notes Placeholder" /> | <img src="docs/screenshots/admin-portal.png" width="400" alt="Admin Portal Placeholder" /> |

*(Replace the remaining `docs/screenshots/...` placeholders with the actual paths to your other screenshot files!)*

</div>

---

## :triangular_ruler: Architecture & Tech Stack

### Frontend
- **Framework:** React 18 with TypeScript, powered by Vite for blazing-fast HMR.
- **Styling:** Tailwind CSS with a curated, clinical-modern color palette (Slate, Teal, Indigo).
- **Animations:** Framer Motion for smooth route transitions and card stagger effects.
- **Data Fetching:** TanStack React Query for caching, optimistic updates, and API state management.
- **Routing:** React Router v6 with protected, role-based layout wrappers.

### Backend
- **Framework:** Spring Boot 3.3.2 (Java 23).
- **Database:** PostgreSQL (hosted on Supabase) managed with Flyway migrations.
- **Security:** Spring Security with stateless JWT (JSON Web Tokens) authentication.
- **Integrations:** 
  - **Google Gemini API** for LLM-powered clinical note generation.
  - **Google Calendar API** via OAuth2 for appointment synchronization.

---

## :gear: Installation & Setup

### Prerequisites
- Node.js (v18+)
- Java 23 (JDK)
- Maven
- PostgreSQL (or a Supabase account)

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/WellPoint.git
cd WellPoint
```

### 2. Backend Setup
1. Open the root directory.
2. Configure your environment variables in `.env`:
   ```env
   DB_URL=jdbc:postgresql://your-supabase-db-url
   DB_USER=postgres
   DB_PASSWORD=your_password
   JWT_SECRET=your_super_secret_jwt_key
   GEMINI_API_KEY=your_google_gemini_key
   ```
3. Run the Spring Boot server:
   ```bash
   mvn clean spring-boot:run
   ```
   *The backend will start on `http://localhost:8080`.*

### 3. Frontend Setup
1. Navigate to the frontend directory:
   ```bash
   cd healthcare-frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```
   *The frontend will start on `http://localhost:5173`.*

---

## :lock: Default Credentials (Dev Environment)

| Role | Email | Password |
| :--- | :--- | :--- |
| **Admin** | `tekadet10@gmail.com` | `admin@123` |
| **Doctor** | *(Created via Admin Portal)* | *(Auto-generated & shown on creation)* |
| **Patient** | *(Self-registration)* | *(Self-registration)* |

---

<div align="center">
  <p>Built with ❤️ by TejaS12112004.</p>
</div>