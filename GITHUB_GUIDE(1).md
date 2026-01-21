# GitHub Setup Guide - Ordering System

## For Project Creator: Pushing Your Project to GitHub

### Step 1: Create a GitHub Repository

1. Go to https://github.com
2. Click the **"+"** icon in the top right
3. Select **"New repository"**
4. Fill in:
   - **Repository name**: `ordering-system` (or whatever you prefer)
   - **Description**: "Web ordering system with React, Node.js, and TiDB"
   - **Visibility**: Public or Private
   - **DO NOT** initialize with README (we already have one)
5. Click **"Create repository"**

### Step 2: Create .gitignore File

In your project root, create a `.gitignore` file:

```bash
cd ordering-system
```

Create a file named `.gitignore` with this content:

```
# Dependencies
node_modules/
backend/node_modules/
frontend/node_modules/

# Environment variables
.env
backend/.env
frontend/.env

# Build files
frontend/dist/
frontend/build/
backend/dist/

# Logs
*.log
npm-debug.log*
logs/

# OS files
.DS_Store
Thumbs.db

# IDE files
.vscode/
.idea/
*.swp
*.swo
*~

# Uploads
backend/uploads/
uploads/

# Package lock files (optional - many include these)
# package-lock.json
# backend/package-lock.json
# frontend/package-lock.json
```

### Step 3: Initialize Git and Push

In your project root directory:

```bash
# Initialize git repository
git init

# Add all files
git add .

# Commit files
git commit -m "Initial commit: Project setup with React, Node.js, and TiDB"

# Add your GitHub repository as remote (replace with YOUR repository URL)
git remote add origin https://github.com/YOUR-USERNAME/ordering-system.git

# Push to GitHub
git branch -M main
git push -u origin main
```

### Step 4: Verify Upload

1. Go to your GitHub repository in your browser
2. You should see all your files EXCEPT:
   - `node_modules/` folders
   - `.env` files
   - Other files in `.gitignore`

---

## For Team Members: Cloning and Setting Up

### Step 1: Clone the Repository

```bash
# Navigate to where you want the project
cd Desktop  # or wherever

# Clone the repository (replace with actual repository URL)
git clone https://github.com/YOUR-USERNAME/ordering-system.git

# Enter the project directory
cd ordering-system
```

### Step 2: Install Dependencies

```bash
# Install root dependencies
npm install

# Install all frontend and backend dependencies
npm run install-all
```

This will download ALL the packages needed (~500-800MB).

### Step 3: Set Up Environment Variables

1. In the `backend` folder, create a `.env` file
2. Copy the contents from `.env.example`
3. Update with your own TiDB credentials:

```bash
cd backend
cp ../.env.example .env
# Now edit .env with your actual credentials
```

**Important**: Never commit your `.env` file to GitHub!

### Step 4: Set Up Database

1. Get access to the TiDB database (ask project owner for credentials)
   OR
2. Create your own TiDB cluster and run the database schema

### Step 5: Start Development

```bash
# From the root directory
npm run dev
```

Your app should now be running:
- Frontend: http://localhost:5173
- Backend: http://localhost:5000

---

## Common Git Commands for Development

### Daily Workflow

```bash
# Before starting work - get latest changes
git pull origin main

# Check what files you've changed
git status

# Add your changes
git add .

# Commit your changes
git commit -m "Description of what you changed"

# Push your changes to GitHub
git push origin main
```

### Working with Branches (Recommended)

```bash
# Create and switch to a new branch for a feature
git checkout -b feature/menu-system

# Make your changes, then commit
git add .
git commit -m "Add menu display component"

# Push your branch to GitHub
git push origin feature/menu-system

# Then create a Pull Request on GitHub to merge into main
```

### Handling Merge Conflicts

If you get a merge conflict:

```bash
# Pull the latest changes
git pull origin main

# Git will tell you which files have conflicts
# Open those files and look for markers like:
# <<<<<<< HEAD
# your changes
# =======
# their changes
# >>>>>>> branch-name

# Edit the files to resolve conflicts
# Remove the markers and keep the code you want

# After fixing conflicts
git add .
git commit -m "Resolve merge conflicts"
git push origin main
```

---

## Repository Structure on GitHub

```
ordering-system/
├── .gitignore               (lists files to not upload)
├── README.md                (project documentation)
├── INSTALLATION_GUIDE.md    (setup instructions)
├── GITHUB_GUIDE.md          (this file)
├── package.json             (root dependencies)
├── .env.example             (template for environment variables)
├── backend/
│   ├── package.json         (backend dependencies)
│   ├── server.js            (your backend code)
│   └── ... (other backend files)
└── frontend/
    ├── package.json         (frontend dependencies)
    ├── vite.config.js       (vite configuration)
    └── ... (your React code)
```

**Note**: `node_modules/` and `.env` files are NOT uploaded to GitHub!

---

## Best Practices

### DO:
✅ Commit frequently with clear messages
✅ Pull before you push
✅ Use branches for new features
✅ Keep your `.env` file private
✅ Update `.gitignore` if needed
✅ Write clear commit messages

### DON'T:
❌ Commit `node_modules/` folders
❌ Commit `.env` files with passwords
❌ Push directly to main without testing
❌ Commit large binary files
❌ Use vague commit messages like "fixed stuff"

---

## Setting Up Collaborators

### For Repository Owner:

1. Go to your repository on GitHub
2. Click **"Settings"**
3. Click **"Collaborators"** in the left sidebar
4. Click **"Add people"**
5. Enter their GitHub username or email
6. Select their permission level (Write access for team members)

### For Collaborators:

1. Accept the email invitation
2. Clone the repository
3. Follow the setup instructions above

---

## Useful GitHub Features

### Issues
Track bugs and feature requests:
- Go to "Issues" tab
- Click "New Issue"
- Describe the bug or feature

### Projects
Organize work with a kanban board:
- Go to "Projects" tab
- Create a new project
- Add issues and track progress

### Pull Requests
Review code before merging:
1. Push your branch
2. Click "Pull Requests" > "New Pull Request"
3. Select your branch
4. Add description
5. Request review from team members

---

## Quick Reference Card

```bash
# Clone repository
git clone <repo-url>

# Check status
git status

# Add changes
git add .

# Commit changes
git commit -m "message"

# Push changes
git push origin main

# Pull updates
git pull origin main

# Create branch
git checkout -b branch-name

# Switch branch
git checkout branch-name

# View branches
git branch
```

---

## Need Help?

- **Git Documentation**: https://git-scm.com/doc
- **GitHub Guides**: https://guides.github.com/
- **Git Cheat Sheet**: https://education.github.com/git-cheat-sheet-education.pdf

Remember: Everyone makes Git mistakes - it's part of learning! Don't be afraid to ask for help.
