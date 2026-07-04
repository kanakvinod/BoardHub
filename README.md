# BoardHub 📋

BoardHub is a high-fidelity, production-grade collaborative Kanban board application designed to track tasks, organize teams, and monitor project workflows. It features a modern, responsive React interface styled with glassmorphic cards and dark-mode gradients, backed by a robust Node.js/Express API.

---

## 🚀 Key Features

- **User Authentication**: Secure signup and login powered by bcrypt password hashing and JWT access & rotation-based refresh tokens (stored in HTTP-Only cookies).
- **Kanban Board Workspaces**: Create project boards, categorize tasks into columns (`To Do`, `In Progress`, `In Review`, `Done`), and drag/move cards seamlessly.
- **Task Customization**: Attach task titles, descriptions, due dates, priority badges (`LOW`, `MEDIUM`, `HIGH`), and assignees.
- **Team Collaboration**: Invite colleagues by email to project boards to co-manage cards.
- **Swagger Documentation**: Self-generating interactive documentation available at `/api-docs`.
- **Health Uptime Monitoring**: A `/health` endpoint exposes real-time uptime, timestamps, and memory usage.

---

## 🛠️ Tech Stack & Architecture

- **Frontend**: React 18 + Vite, TypeScript, TailwindCSS, TanStack Query (caching state), Zustand (auth state), and Lucide Icons.
- **Backend**: Node.js (v20 LTS), Express, TypeScript, Zod (payload validation), and Pino (structured logging).
- **Database**: PostgreSQL with Prisma ORM.
- **DevOps**: Docker, Docker Compose, Nginx (static asset routing), and GitHub Actions (CI/CD pipelines).

```
                  HTTPS                  TCP
┌───────────────┐        ┌─────────────┐        ┌──────────────┐
│   React SPA   │ ─────> │ Node/Express│ ─────> │  PostgreSQL  │
│ (Nginx Port 80)│  JSON  │(API Port 4000)│        │ (Port 5432)  │
└───────────────┘        └─────────────┘        └──────────────┘
                                ▲
                                │
                        ┌───────┴───────┐
                        │ GitHub Actions│
                        └───────────────┘
```

---

## 📦 Quick Start (Docker Compose)

The easiest way to run the entire stack (Database, Backend, and Frontend) is via Docker Compose.

### Prerequisites
- Docker and Docker Compose installed on your system.

### Steps
1. **Clone the Repository**
2. **Launch Container Suite**
   Run the following command in the project root:
   ```bash
   docker compose up --build
   ```
   *This command spins up the PostgreSQL instance, runs Prisma schema pushes, seeds default users/tasks, and launches both backend (port 4000) and frontend (port 3000).*

3. **Log In with Seed Credentials**
   Open your browser to `http://localhost:3000` and use the following account:
   - **Email**: `demo@boardhub.com`
   - **Password**: `Password123!`

---

## 💻 Local Development Setup (Manual)

If you prefer to run the components individually for testing:

### 1. Database (PostgreSQL)
Ensure you have a PostgreSQL database running and update the `DATABASE_URL` in the environment files.

### 2. Backend API
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Copy the environment template and configure:
   ```bash
   cp .env.example .env
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Push database schema and run seed script:
   ```bash
   npx prisma db push
   npx prisma db seed
   ```
5. Run dev server (with hot reload):
   ```bash
   npm run dev
   ```
   *API will be listening at http://localhost:4000*

### 3. Frontend Client
1. Navigate to the frontend directory:
   ```bash
   cd ../frontend
   ```
2. Copy the environment template:
   ```bash
   cp .env.example .env
   ```
3. Install dependencies and start:
   ```bash
   npm install
   npm run dev
   ```
   *Client will be listening at http://localhost:3000*

---

## 🧪 Testing Suite

We use **Vitest** and **Supertest** to execute unit and integration tests.

Run tests from the `backend` directory:
```bash
# Run tests once
npm run test

# Run tests with code coverage reports
npm run test:coverage
```

---

## 📖 API Documentation Reference

Interactive Swagger documentation is served at:
👉 **[http://localhost:4000/api-docs](http://localhost:4000/api-docs)**

### Core REST Endpoints Catalog

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :---: |
| **POST** | `/api/v1/auth/register` | Register a new user | No |
| **POST** | `/api/v1/auth/login` | Log in and set refresh cookie | No |
| **POST** | `/api/v1/auth/refresh` | Rotate access & refresh tokens | No |
| **POST** | `/api/v1/auth/logout` | Clear active cookie session | No |
| **GET** | `/api/v1/projects` | Fetch all boards | **Yes** |
| **POST** | `/api/v1/projects` | Create a new board | **Yes** |
| **GET** | `/api/v1/projects/:id` | Fetch specific board (with tasks/members) | **Yes** |
| **POST** | `/api/v1/projects/:id/members` | Invite colleague to board | **Yes** |
| **POST** | `/api/v1/tasks` | Create a task | **Yes** |
| **PUT** | `/api/v1/tasks/:id` | Modify task (details or column transition) | **Yes** |
| **DELETE** | `/api/v1/tasks/:id` | Delete task | **Yes** |
| **GET** | `/health` | Check backend memory/uptime metrics | No |

---

## ⚠️ Known Limitations & Future Work
- **WebSockets**: Add real-time synchronization so boards update dynamically when another member edits a task.
- **Drag-and-Drop library**: Use `@hello-pangea/dnd` instead of simple click arrows for smoother UI manipulation.
