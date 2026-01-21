# Ordering System Project

A full-stack web ordering system similar to McDonald's, built with React, Node.js/Express, and TiDB.

## Project Structure

```
ordering-system/
├── backend/
│   ├── package.json
│   ├── server.js
│   ├── .env
│   └── ... (your backend code)
├── frontend/
│   ├── package.json
│   ├── vite.config.js
│   └── ... (your React code)
├── package.json (root)
└── README.md
```

## Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- TiDB Cloud account (or local TiDB installation)

## Installation Steps

### 1. Set up your project structure

Create the following folder structure:
```bash
mkdir ordering-system
cd ordering-system
mkdir backend frontend
```

### 2. Copy package.json files

- Copy `backend-package.json` to `backend/package.json`
- Copy `frontend-package.json` to `frontend/package.json`
- Copy `root-package.json` to `package.json` (in the root directory)

### 3. Install all dependencies

From the root directory:
```bash
npm install
npm run install-all
```

This will install dependencies for both frontend and backend.

### 4. Set up environment variables

In the `backend` directory, create a `.env` file:
```bash
cd backend
cp ../.env.example .env
```

Edit the `.env` file with your actual TiDB credentials and configuration.

### 5. Set up TiDB Database

Connect to your TiDB instance and create the database:
```sql
CREATE DATABASE ordering_system;
USE ordering_system;
```

Then create your tables (refer to the database schema provided).

### 6. Start development servers

From the root directory:
```bash
npm run dev
```

This will start both the backend (port 5000) and frontend (port 5173) concurrently.

Or start them separately:
```bash
# Terminal 1 - Backend
npm run server

# Terminal 2 - Frontend
npm run client
```

## Development

- **Backend API**: http://localhost:5000
- **Frontend**: http://localhost:5173

## Key Technologies

### Backend
- **Express**: Web framework
- **mysql2**: Database driver (TiDB compatible)
- **bcrypt**: Password hashing
- **jsonwebtoken**: JWT authentication
- **helmet**: Security middleware
- **morgan**: HTTP request logger

### Frontend
- **React**: UI library
- **Vite**: Build tool and dev server
- **React Router**: Client-side routing
- **Axios**: HTTP client
- **TanStack Query**: Data fetching and caching
- **React Hook Form**: Form management
- **Zustand**: State management
- **Tailwind CSS**: Styling

## Available Scripts

### Root directory
- `npm run dev` - Run both frontend and backend
- `npm run server` - Run backend only
- `npm run client` - Run frontend only
- `npm run install-all` - Install all dependencies

### Backend
- `npm start` - Start production server
- `npm run dev` - Start development server with nodemon

### Frontend
- `npm run dev` - Start Vite dev server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

## Next Steps

1. Create your database schema in TiDB
2. Set up Express routes and controllers
3. Build React components for your UI
4. Implement authentication
5. Add order management functionality
6. Style with Tailwind CSS

## Notes

- Make sure to never commit your `.env` file
- Update the `FRONTEND_URL` in `.env` if deploying
- For production, set `NODE_ENV=production`
