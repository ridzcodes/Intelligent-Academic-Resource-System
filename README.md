# Intelligent Academic Resource Retrieval and Recommendation System

> **College Mini Project** — A comprehensive, modern academic resource discovery and sharing platform for college students, faculty, and administrators.

---

## 1. Project Overview

The **Intelligent Academic Resource Retrieval and Recommendation System** is designed to solve the common challenge students face when searching for reliable, organized, and curriculum-aligned study materials (lecture notes, textbooks, previous question papers, lab manuals, and assignments).

The platform provides a centralized, role-authenticated portal where students can discover, search, filter, and upload academic resources, while faculty/administrators maintain academic quality through a moderation approval workflow.

> **Project Phase Status:**
> - **Phase 1 (Current):** Clean, modular Full-Stack Foundation (React + Vite + Tailwind CSS + Node.js + Express + MongoDB + Multer PDF pipeline).
> - **Phase 2 (Future):** Python FastAPI Microservice for PDF text extraction, Sentence-Transformer vector embeddings, vector similarity search, and hybrid personalized recommendations.

---

## 2. Problem Statement

In most colleges and universities:
- Study materials are scattered across informal chat groups, cloud drives, and email threads without versioning or moderation.
- Searching for specific syllabus topics or past question papers is time-consuming and inefficient.
- There is no single repository verifying material quality or categorizing items by Department and Semester.
- New students struggle to discover standard references recommended for their specific courses.

---

## 3. Project Objectives

1. **Centralized Repository:** Provide a unified repository for academic study materials categorized by Engineering Department, Semester (1 to 8), and Resource Type.
2. **Quality Moderation:** Implement an admin approval workflow where uploaded materials start as `pending` before being verified for public catalog access.
3. **Keyword-Based Search & Discovery:** Enable faceted filtering and keyword retrieval across subjects, titles, syllabus descriptions, and topic tags.
4. **Secure Authentication:** Role-based access control (Student and Admin) using bcrypt password hashing and JSON Web Tokens (JWT).
5. **AI-Ready Microservice Architecture:** Prepare clean schema hooks and service contracts for future Python-based semantic vector search.

---

## 4. Key Features

### For Students
- **Interactive Landing & Catalog:** Browse resources categorized by Notes, Textbooks, Question Papers, Lab Manuals, Assignments, and Presentations.
- **Faceted Filters & Search:** Filter by Department, Semester (1–8), Resource Type, or sort by Newest, Most Downloaded, and Most Viewed.
- **Resource Details & In-Browser PDF Preview:** Inspect syllabus descriptions, author metadata, tags, and preview documents directly in the browser or download.
- **Resource Upload:** Drag-and-drop PDF upload with progress tracking and tag assignment (initial status set to `pending`).
- **Student Dashboard & Upload Management:** Monitor personal uploads, view download/view statistics, and edit or delete contributed files.
- **Curated Recommendations:** Tailored recommendations matching the student's department and academic year.
- **Student Profile:** Update profile details, department, academic year, or password.

### For Administrators
- **Administrative Dashboard:** Real-time analytics tracking total users, total resources, pending review queue, and total downloads.
- **Moderation Queue:** Approve, reject, or delete submitted student materials.
- **User Role Management:** View all registered accounts, change roles (Student ⇄ Admin), and manage permissions safely.

---

## 5. Technology Stack

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Frontend** | React (v18) + Vite | Fast, modern component-based single-page application |
| **Styling** | Tailwind CSS | Modern academic UI design system with responsive layouts |
| **Icons** | Lucide React | Clean, modern UI iconography |
| **Routing** | React Router DOM (v6) | Client-side routing with protected and role-guarded routes |
| **HTTP Client** | Axios | REST API communication with JWT interceptors |
| **Backend** | Node.js + Express.js | Modular REST API server |
| **Database** | MongoDB + Mongoose | Document database with schema validation and indexing |
| **Authentication** | JWT + bcryptjs | Secure stateless authentication and password hashing |
| **File Storage** | Multer | Local PDF upload handling with MIME validation |
| **Future AI** | Python + FastAPI | Microservice for Embeddings, Semantic Search & Vector DB |

---

## 6. Directory & Folder Structure

```
Intelligent-Academic-Resource-System/
│
├── client/                               # React + Vite Frontend
│   ├── public/
│   ├── src/
│   │   ├── assets/                       # Static media and assets
│   │   ├── components/
│   │   │   ├── auth/                     # ProtectedRoute & RoleRoute guards
│   │   │   └── common/                   # Navbar, Sidebar, Footer, ResourceCard, FilterBar, SearchBar, Modal, Toast
│   │   ├── context/                      # AuthContext for global user state
│   │   ├── hooks/                        # useAuth, useDebounce custom hooks
│   │   ├── layouts/                      # MainLayout, DashboardLayout, AuthLayout
│   │   ├── pages/
│   │   │   ├── public/                   # HomePage, LoginPage, RegisterPage, NotFoundPage
│   │   │   ├── student/                  # Dashboard, Browse, Search, Details, Upload, MyResources, Recommendations, Profile
│   │   │   └── admin/                    # AdminDashboard, ManageResources, ManageUsers
│   │   ├── services/                     # api.js (Axios), authService.js, resourceService.js
│   │   ├── utils/                        # constants.js, formatters.js
│   │   ├── App.jsx                       # Master React Router configuration
│   │   ├── index.css                     # Tailwind CSS directives & custom styles
│   │   └── main.jsx                      # Vite entry point
│   ├── index.html
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.js
│
├── server/                               # Node.js + Express Backend
│   ├── src/
│   │   ├── config/
│   │   │   └── db.js                     # MongoDB connection with Mongoose
│   │   ├── controllers/
│   │   │   ├── authController.js         # Register, Login, Profile controllers
│   │   │   ├── resourceController.js     # Search, filter, upload, download controllers
│   │   │   └── userController.js         # Admin user & moderation controllers
│   │   ├── middleware/
│   │   │   ├── authMiddleware.js         # JWT verify and role authorization
│   │   │   ├── errorMiddleware.js        # Centralized 404 & error handlers
│   │   │   └── uploadMiddleware.js       # Multer PDF file filter & disk storage
│   │   ├── models/
│   │   │   ├── Resource.js               # Resource Mongoose Schema with text index
│   │   │   └── User.js                   # User Schema with bcrypt hashing
│   │   ├── routes/
│   │   │   ├── authRoutes.js             # /api/auth
│   │   │   ├── resourceRoutes.js         # /api/resources
│   │   │   ├── userRoutes.js             # /api/admin
│   │   │   └── index.js                  # Main API router & /api/health
│   │   ├── utils/
│   │   │   ├── constants.js              # Enums (Departments, Types, Semesters, Roles)
│   │   │   └── generateToken.js          # JWT sign utility
│   │   ├── app.js                        # Express app setup, CORS, static uploads
│   │   └── server.js                     # Server listener entry point
│   ├── uploads/                          # Local directory for uploaded PDFs
│   ├── .env.example                      # Environment variables template
│   ├── .env                              # Development configuration
│   └── package.json
│
├── ai-service/                           # Python AI Microservice (Phase 2)
│   ├── main.py                           # Placeholder FastAPI application
│   ├── requirements.txt                  # Python dependencies (sentence-transformers, chromadb, etc.)
│   └── README.md                         # Architecture explanation for AI pipeline
│
├── .gitignore                            # Root gitignore
└── README.md                             # Comprehensive Project Documentation
```

---

## 7. Setup & Installation Instructions

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- [MongoDB](https://www.mongodb.com/try/download/community) running locally or a [MongoDB Atlas](https://www.mongodb.com/atlas) cloud URI.

---

### Step 1: Clone or Open Workspace
Ensure you are in the project root directory:
```bash
cd Intelligent-Academic-Resource-System
```

---

### Step 2: Backend Setup & Run

1. Navigate to the `server/` directory:
   ```bash
   cd server
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables:
   A `.env` file is already created. You can customize `server/.env` if using a custom MongoDB connection:
   ```env
   PORT=5000
   NODE_ENV=development
   MONGODB_URI=mongodb://127.0.0.1:27017/academic_resource_db
   JWT_SECRET=academic_resource_system_jwt_secret_dev_key_2024
   CLIENT_URL=http://localhost:5173
   MAX_FILE_SIZE_MB=25
   ```

4. Start the backend development server:
   ```bash
   npm run dev
   ```
   *(Or `npm start` for standard Node.js mode)*

   - API Health Check: `http://localhost:5000/api/health`

---

### Step 3: Frontend Setup & Run

1. Open a new terminal and navigate to the `client/` directory:
   ```bash
   cd client
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the Vite development server:
   ```bash
   npm run dev
   ```

4. Open your browser and navigate to:
   ```
   http://localhost:5173
   ```

---

## 8. REST API Endpoints Reference

### Public & Health
| Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/health` | Service health status check | Public |

### Authentication (`/api/auth`)
| Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Register new student or admin account | Public |
| `POST` | `/api/auth/login` | Authenticate user & retrieve JWT token | Public |
| `GET` | `/api/auth/profile` | Get current logged-in user profile | Protected (JWT) |
| `PUT` | `/api/auth/profile` | Update profile information or password | Protected (JWT) |

### Academic Resources (`/api/resources`)
| Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/resources` | Get approved resources (with search, filter, sort, pagination) | Public |
| `GET` | `/api/resources/:id` | Get resource details & increment view count | Public |
| `GET` | `/api/resources/:id/download` | Download PDF file & increment download count | Public |
| `POST` | `/api/resources/upload` | Upload PDF resource (`multipart/form-data`) | Protected (Student/Admin) |
| `GET` | `/api/resources/my/uploads` | Get resources uploaded by logged-in user | Protected |
| `PUT` | `/api/resources/:id` | Update resource metadata | Owner / Admin |
| `DELETE` | `/api/resources/:id` | Delete resource and remove file from disk | Owner / Admin |

### Administration (`/api/admin`)
| Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/admin/stats` | Get overview analytics (Users, Resources, Downloads) | Admin Only |
| `GET` | `/api/admin/resources` | Get all resources including pending and rejected | Admin Only |
| `PATCH` | `/api/resources/:id/status` | Update resource status (`approved`, `rejected`, `pending`) | Admin Only |
| `GET` | `/api/admin/users` | List all registered users | Admin Only |
| `PATCH` | `/api/admin/users/:id/role` | Promote/demote user role (`student` ⇄ `admin`) | Admin Only |
| `DELETE` | `/api/admin/users/:id` | Delete user account | Admin Only |

---

## 9. Future AI Microservice Architecture (Phase 2 Roadmap)

In Phase 2, the system will be extended with the Python AI microservice located in `ai-service/`:

```
   [ Student Natural Query ]
              │
              ▼
   [ FastAPI Microservice ] ───► [ Sentence-Transformers Embedding Model ]
              │                                    │
              ▼                                    ▼
   [ ChromaDB / Vector Store ] ◄──── [ Dense 384-d Vector Representation ]
              │
              ▼
   [ Cosine Similarity Match ] ───► [ Top Ranked Relevant Resource Chunks ]
```

1. **PDF Text Extraction & Chunking:** `pypdf` / `pdfplumber` will extract raw text from uploaded PDFs and split it into semantic chunks preserving chapter context.
2. **Dense Vector Embeddings:** Hugging Face `sentence-transformers/all-MiniLM-L6-v2` will convert chunks into 384-dimensional dense vectors.
3. **Vector Similarity Indexing:** Embeddings stored in a vector database (ChromaDB / FAISS).
4. **Semantic Search:** Students can search natural queries like *"How does virtual memory paging work?"* and retrieve the exact relevant lecture notes even if keywords do not match verbatim.
5. **Personalized Recommendations:** Hybrid algorithm combining student department/semester history with peer affinity vectors.

---

## 10. Viva / Presentation Points

When explaining this project in your college viva:
- **Architecture Pattern:** Model-View-Controller (MVC) on backend, Component-based SPA on frontend.
- **Security:** Passwords are never stored in plaintext; they are salted and hashed with `bcryptjs` (10 salt rounds). All protected actions require an authorization header (`Bearer <token>`).
- **File Upload Security:** Multer inspects both MIME type (`application/pdf`) and file extension, saving sanitized unique filenames to prevent path traversal.
- **Scalability:** Stateless JWT authentication enables simple horizontal scaling without server-side session locks.
