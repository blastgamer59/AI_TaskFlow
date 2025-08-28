# 🧠 Smart Taskflow – AI‑powered Task & Project Manager

Smart Taskflow is a full-stack project management system designed for real-world productivity, featuring role-based access and an AI assistant powered by Gemini. Built for teams and solo developers alike, it supports real-time task creation, user-specific analytics, and smart automation.

---

## 🚀 Features

* 🔐 Login required for all users (Firebase auth)
* 🧑‍💻 **User Dashboard** – View, manage, and complete your own tasks
* 🧑‍🔧 **Admin Dashboard** – View all registered users and assign tasks to them
* 📋 Kanban-style task board with task creation and status updates
* 📊 Analytics: task completion, productivity insights, and team stats
* 🤖 AI Assistant powered by **Google Gemini**
* Users get actionable technical task suggestions
* Admins get high-level project breakdowns with team role mapping
* 🧾 MongoDB backend with full REST API support

---

## 👥 Roles & Permissions

### Regular Users:

* Can view only their own tasks
* Use AI Assistant for technical task generation
* View personal analytics

### Admins:

* View all users and their analytics
* Assign tasks to any user
* Use AI Assistant for strategic planning
* Create projects, manage workflow

---

## ⚙️ Tech Stack

**Frontend:** React.js, Tailwind CSS, Toastify, Lucide Icons
**Backend:** Node.js, Express.js, MongoDB, Google Gemini API
**AI:** Google Gemini via `@google/generative-ai`
**Auth:** Firebase


## 🛠️ Setup Instructions

### 1. Clone the Repo

```bash
git clone https://github.com/yourusername/smart-taskflow.git
cd smart-taskflow
```

### 2. Setup Backend

```bash
cd backend
npm install
cp .env.example .env  # Add your Mongo URI and GEMINI_API_KEY
npm start
```

### 3. Setup Frontend

```bash
cd frontend
npm install
npm start
```

---

## 🧠 Example AI Usage

* User types: "Build a user authentication system"
  → AI returns 4–6 technical tasks with estimates and priority

* Admin types: "Improve developer velocity across teams"
  → AI returns high-level strategic suggestions with role assignments


## 📊 Analytics

* Users see: task completion %, overdue tasks, task trends
* Admins see: team workloads, task distribution, and project summaries
