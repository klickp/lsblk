# Ordering System

A full-stack web ordering system similar to McDonald's or UberEats, built with **React**, **Node.js/Express**, and **TiDB**.

**Status**: In Development | **Version**: 1.0.0

## 📋 About

This project is a restaurant ordering system that allows customers to:
- Browse menu items by category
- Add items to cart with customizations
- Place orders with delivery address
- Track order status
- Manage account and address book

## 🏗️ Project Structure

```
ordering-system/
├── backend/                      # Express.js API server
│   ├── package.json
│   ├── server.js
│   └── .env (not committed)
├── frontend/                     # React web application
│   ├── package.json
│   ├── vite.config.js
│   └── src/
├── db/                          # Database files
│   ├── schema.sql               # Main database schema
│   ├── test.session.sql         # Test/demo data
│   └── view_tables.sql          # Utility scripts
├── package.json                 # Root workspace
├── .env.example                 # Environment template
├── README.md                    # This file
├── INSTALLATION_GUIDE.md        # Detailed setup steps
├── GITHUB_GUIDE.md              # Git workflow guide
└── LICENSE                      # MIT License
```

## 🛠️ Tech Stack

### Backend
- **Express.js** - Web framework
- **mysql2** - Database driver (TiDB compatible)
- **bcrypt** - Password hashing
- **jsonwebtoken** - JWT authentication
- **helmet** - Security middleware
- **morgan** - HTTP request logging
- **express-validator** - Input validation
- **multer** - File upload handling
- **winston** - Logging

### Frontend
- **React 18** - UI library
- **Vite** - Build tool and dev server
- **React Router v6** - Client-side routing
- **Axios** - HTTP client
- **TanStack Query** - Data fetching and caching
- **React Hook Form** - Form management
- **Zustand** - State management
- **Tailwind CSS** - Utility-first CSS framework

### Database
- **TiDB** - MySQL-compatible distributed database

## 📦 Prerequisites

- **Node.js** v18 or higher ([download](https://nodejs.org/))
- **npm** v9+ or **yarn** (comes with Node.js)
- **TiDB Cloud** account ([sign up](https://tidbcloud.com/)) or local TiDB installation
- **Git** for version control

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/YOUR-USERNAME/ordering-system.git
cd ordering-system
```

### 2. Install Dependencies

```bash
npm install
npm run install-all
```

This installs dependencies for root, backend, and frontend.

### 3. Configure Environment Variables

```bash
cd backend
cp ../.env.example .env
```

Edit `backend/.env` with your TiDB credentials:

```env
DB_HOST=gateway01.us-west-2.prod.aws.tidbcloud.com
DB_PORT=4000
DB_USER=your_username
DB_PASSWORD=your_password
DB_NAME=ordering_system
JWT_SECRET=your_super_secret_key
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
```

### 4. Set Up Database

Connect to TiDB and run the schema:

```bash
# Using mysql CLI or TiDB client:
mysql -h <DB_HOST> -u <DB_USER> -p < ../db/schema.sql
```

Or paste the contents of `db/schema.sql` into your TiDB GUI tool.

### 5. Start Development Servers

From the root directory:

```bash
npm run dev
```

This runs both backend and frontend concurrently:
- **Backend API**: http://localhost:5000
- **Frontend**: http://localhost:5173

Or run separately in different terminals:

```bash
# Terminal 1 - Backend
npm run server

# Terminal 2 - Frontend  
npm run client
```

## 📖 Available Scripts

### Root Directory

```bash
npm run dev           # Start both frontend and backend concurrently
npm run server        # Start backend only
npm run client        # Start frontend only
npm run install-all   # Install dependencies for backend and frontend
npm run build         # Build frontend for production
```

### Backend (`cd backend`)

```bash
npm start             # Start production server
npm run dev           # Start with nodemon (auto-restart on changes)
npm test              # Run tests (placeholder)
```

### Frontend (`cd frontend`)

```bash
npm run dev           # Start Vite dev server with HMR
npm run build         # Build optimized production bundle
npm run preview       # Preview production build locally
npm run lint          # Run ESLint
```

## 🗄️ Database

### Schema Overview

The database includes the following main tables:

- **Customers** - User accounts and authentication
- **Addresses** - Delivery addresses
- **Menu_Categories** - Food categories (Burgers, Drinks, etc.)
- **Menu_Items** - Individual menu items
- **Customizations** - Item customizations (extra toppings, etc.)
- **Orders** - Customer orders
- **Order_Items** - Items in each order
- **Order_Item_Customizations** - Customization selections per item
- **Payment_Transactions** - Payment records

### Reset Database

To clear all tables and start fresh:

```bash
# Using mysql CLI:
mysql -h <DB_HOST> -u <DB_USER> -p < db/test.session.sql
```

This will drop all tables and recreate the schema.

## 📚 Documentation

- **[INSTALLATION_GUIDE.md](INSTALLATION_GUIDE.md)** - Detailed installation and setup instructions
- **[GITHUB_GUIDE.md](GITHUB_GUIDE.md)** - Git workflow, branching, and collaboration guide
- **[db/schema.sql](db/schema.sql)** - Database schema with table definitions
- **[db/test.session.sql](db/test.session.sql)** - SQL for resetting database

## 🔐 Security Notes

⚠️ **Important:**
- Never commit `.env` files with credentials
- `node_modules/` folders are not committed
- Use strong JWT secrets in production
- Always validate user input on both client and server
- Use HTTPS in production
- Implement rate limiting for sensitive endpoints

## 🤝 Contributing

1. Create a feature branch: `git checkout -b feature/your-feature`
2. Commit changes: `git commit -m "Add your feature"`
3. Push branch: `git push origin feature/your-feature`
4. Create a Pull Request

See [GITHUB_GUIDE.md](GITHUB_GUIDE.md) for detailed workflow.

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Troubleshooting

### Connection Refused on Port 5000
- Backend server isn't running
- Run `npm run server` in the `backend` directory
- Check that port 5000 is not in use: `lsof -i :5000`

### Database Connection Error
- Verify TiDB credentials in `.env`
- Check network connectivity to TiDB Cloud
- Ensure database `ordering_system` exists
- Verify user has proper permissions

### Frontend not connecting to backend
- Check `FRONTEND_URL` in backend `.env`
- Verify backend is running on port 5000
- Check browser console for CORS errors

### npm install fails
- Delete `node_modules` and `package-lock.json`: `rm -rf node_modules package-lock.json`
- Run `npm install` again
- Try clearing npm cache: `npm cache clean --force`

## 🎯 Next Steps

1. ✅ Clone and setup project
2. 📝 Create backend API endpoints
3. 🎨 Build React components
4. 🔐 Implement authentication
5. 🛒 Add shopping cart functionality
6. 💳 Integrate payment system
7. 📦 Implement order tracking
8. 🚀 Deploy to production

## 📞 Support

For questions or issues, please:
- Check [INSTALLATION_GUIDE.md](INSTALLATION_GUIDE.md)
- Review existing code and comments
- Check database schema in [db/schema.sql](db/schema.sql)

---

**Happy coding!** 🎉
