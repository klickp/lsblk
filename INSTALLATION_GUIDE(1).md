# Installation Guide - Ordering System

## Required Software to Download

Before starting, you need to install the following on your computer:

### 1. Node.js and npm
- **Download**: https://nodejs.org/
- **Version**: Download the LTS (Long Term Support) version
- **What it includes**: Node.js runtime and npm (Node Package Manager)
- **How to verify installation**:
  ```bash
  node --version
  npm --version
  ```

### 2. Git
- **Download**: https://git-scm.com/downloads
- **Purpose**: Version control and cloning repositories
- **How to verify installation**:
  ```bash
  git --version
  ```

### 3. Visual Studio Code
- **Download**: https://code.visualstudio.com/
- **Purpose**: Code editor for development
- **Recommended Extensions**:
  - ESLint
  - Prettier
  - ES7+ React/Redux/React-Native snippets
  - Tailwind CSS IntelliSense

### 4. TiDB Cloud Account (or MySQL Workbench)
- **Option A - TiDB Cloud** (Recommended): https://tidbcloud.com/
  - Sign up for a free account
  - Create a new cluster
  - Get your connection credentials
- **Option B - Local MySQL**: https://dev.mysql.com/downloads/workbench/
  - TiDB is MySQL-compatible, so MySQL works for development

### 5. Postman or Thunder Client (Optional but Recommended)
- **Postman**: https://www.postman.com/downloads/
- **Thunder Client**: VS Code extension (search in Extensions)
- **Purpose**: Testing API endpoints

---

## NPM Packages Installation

You **DON'T** need to manually download each package. When you run `npm install`, all packages listed in package.json will be automatically downloaded.

### Backend Packages (Automatically installed)
```
express - Web framework
mysql2 - Database driver for TiDB/MySQL
dotenv - Environment variable management
cors - Cross-Origin Resource Sharing
bcrypt - Password hashing
jsonwebtoken - JWT authentication
express-validator - Input validation
helmet - Security headers
morgan - HTTP logging
multer - File upload handling
express-rate-limit - API rate limiting
joi - Schema validation
winston - Advanced logging
nodemon - Auto-restart server (dev)
eslint - Code linting (dev)
prettier - Code formatting (dev)
```

### Frontend Packages (Automatically installed)
```
react - UI library
react-dom - React DOM rendering
react-router-dom - Client-side routing
axios - HTTP requests
@tanstack/react-query - Data fetching/caching
react-hook-form - Form handling
zustand - State management
vite - Build tool and dev server
tailwindcss - CSS framework
postcss - CSS processing
autoprefixer - CSS vendor prefixes
eslint - Code linting (dev)
prettier - Code formatting (dev)
```

### Root Package (Automatically installed)
```
concurrently - Run multiple commands simultaneously
```

---

## Complete Setup Instructions

### Step 1: Install Required Software
1. Download and install Node.js from https://nodejs.org/
2. Download and install Git from https://git-scm.com/
3. Download and install VS Code from https://code.visualstudio.com/
4. Sign up for TiDB Cloud at https://tidbcloud.com/

### Step 2: Create Project Structure
Open your terminal/command prompt:

```bash
# Navigate to where you want your project
cd Desktop  # or wherever you want

# Create project folder
mkdir ordering-system
cd ordering-system

# Create backend and frontend folders
mkdir backend
mkdir frontend
```

### Step 3: Set Up Files

Copy the files I provided into the correct locations:
```
ordering-system/
├── package.json (root-package.json renamed)
├── README.md
├── backend/
│   ├── package.json (backend-package.json renamed)
│   └── .env (create from .env.example)
└── frontend/
    └── package.json (frontend-package.json renamed)
```

### Step 4: Install All Packages

From the root `ordering-system` directory:

```bash
# Install root dependencies
npm install

# Install all frontend and backend dependencies
npm run install-all
```

This will automatically download and install ALL packages needed!

### Step 5: Set Up TiDB Database

1. Log into TiDB Cloud
2. Create a new cluster (use the free tier)
3. Get your connection details:
   - Host
   - Port
   - Username
   - Password
4. Update your `backend/.env` file with these credentials

### Step 6: Create Database Tables

Connect to your TiDB database and run the SQL to create your tables (use the schema provided earlier).

### Step 7: Start Development

From the root directory:
```bash
npm run dev
```

This starts both frontend (http://localhost:5173) and backend (http://localhost:5000)!

---

## Troubleshooting

### "npm command not found"
- Node.js is not installed or not in PATH
- Reinstall Node.js and restart your terminal

### "Cannot connect to database"
- Check your .env file credentials
- Ensure TiDB cluster is running
- Check if your IP is whitelisted in TiDB Cloud

### Port already in use
- Change the PORT in backend/.env
- Or kill the process using that port

### Module not found errors
- Run `npm install` again in the specific directory (backend or frontend)
- Delete `node_modules` and `package-lock.json`, then reinstall

---

## What Gets Installed Where

```
ordering-system/
├── node_modules/          (concurrently)
├── backend/
│   └── node_modules/      (express, mysql2, bcrypt, etc.)
└── frontend/
    └── node_modules/      (react, vite, axios, etc.)
```

Total size: Approximately 500MB-800MB for all packages combined.
