# ⚛️ Smart Exam Platform Frontend (React)

A **modern, scalable frontend** for a hybrid exam system supporting:

* 📝 MCQ Exams
* 💻 Practical VM-based Exams
* 👨‍💼 Admin Dashboard
* 👨‍🎓 Student Portal

Built using **React.js with Context API and secure API integration**.

---

# 🧠 Frontend Architecture

```text
React App
│
├── Auth System (Login / OTP / Password Reset)
├── Admin Panel
│   ├── Student Management
│   ├── MCQ Exam Management
│   ├── Practical Task Management
│
├── Student Panel
│   ├── MCQ Exams
│   ├── Practical Exams (VM Based)
│   ├── Practice Mode
│   ├── Results
│
└── API Layer (Centralized Service)
```

---

# 🚀 Key Features

## 🔐 Authentication System

* Login with OTP
* Password reset & force change
* Token-based session

## 👨‍💼 Admin Panel

* Add/manage students
* Upload MCQ questions
* Create/edit exams
* Manage practical tasks
* View results

## 👨‍🎓 Student Panel

* Attempt MCQ exams
* Take practical exams (VM-based)
* Practice mode
* View results & profile

---

# ⚡ Practical Exam (VM Integration)

Frontend connects to:

* Django → session & student data
* FastAPI → VM execution

### Flow:

```text
Start Practical Exam
        ↓
Call Django API (create session)
        ↓
Call FastAPI (/vm/start)
        ↓
VM Ready
        ↓
Student writes code
        ↓
Submit → FastAPI (/vm/verify)
        ↓
Score returned
```

---

# 📂 Project Structure

```text
MCQFRONTEND/
│
├── public/
├── src/
│   ├── components/
│   │   ├── Admin/
│   │   ├── Student/
│   │   ├── Auth/
│   │   ├── Shared/
│   │
│   ├── services/     # API Layer
│   ├── context/      # Auth + Exam Context
│   ├── hooks/
│   ├── utils/
│   ├── styles/
│
├── App.js
├── package.json
└── .env
```

---

# 🔌 API Configuration (CORE)

Your frontend uses a **centralized API handler**:

✔ Token handling
✔ Auto logout on 401
✔ URL normalization (very important)
✔ FormData + JSON support

Example:

```javascript
const API_BASE_URL = "http://localhost:8000/api";
```

### Features of API Layer

* Handles all HTTP methods
* Automatically attaches token
* Normalizes URLs
* Handles errors globally

---

# 🔐 Authentication Handling

* Token stored in `localStorage`
* Auto redirect on unauthorized access
* Role-based routing (Admin / Student)

---

# 🧩 Routing System (Important 🔥)

### Public Routes

* `/login`
* `/login-otp`
* `/password-reset`

### Admin Routes

* `/admin`
* `/admin/add-student`
* `/admin/exam-list`
* `/admin/practical`

### Student Routes

* `/student`
* `/student/exams`
* `/student/practicals`
* `/student/results`

### Practical Flow Routes

* `/student/practical/:taskId/start`
* `/student/practical/session/:sessionId`
* `/student/practical/result/:sessionId`

---

# ⚙️ Installation

```bash
git clone https://github.com/fqthedeveloper/mcqfrontendBackup.git
cd MCQFRONTEND

npm install
npm start
```

---

# 🌐 Environment Variables

Create `.env` file:

```env
REACT_APP_API_URL=http://localhost:8000/api/
REACT_APP_FASTAPI_URL=http://localhost:8001/
```

---

# 🔗 Backend Integration

| Service    | URL                        |
| ---------- | -------------------------- |
| Django API | http://localhost:8000/api/ |
| FastAPI VM | http://localhost:8001/     |

---

# 🎯 Why This Frontend is Strong 🔥

✔ Clean architecture
✔ Role-based routing
✔ Secure API layer
✔ Handles complex exam flows
✔ Supports real VM-based execution

---

# 🔮 Future Enhancements

* Code editor (Monaco Editor)
* Live exam timer sync
* WebSocket integration
* PWA support

---

# 👨‍💻 Author

Faizan Qureshi
Full Stack Developer | Cloud Engineer

---

# 📄 License

MIT License
