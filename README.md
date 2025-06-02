# ExpenseXpert - Personal Finance Tracker

A comprehensive personal finance tracker with modern dark theme UI built with Next.js, Express.js, and MongoDB. Track your income, expenses, and visualize your financial data with beautiful charts and analytics.

## 🌐 Live Demo

- **Frontend**: [https://work-1-icutqkfevhwhiyhf.prod-runtime.all-hands.dev](https://work-1-icutqkfevhwhiyhf.prod-runtime.all-hands.dev)
- **Backend API**: [https://work-2-icutqkfevhwhiyhf.prod-runtime.all-hands.dev](https://work-2-icutqkfevhwhiyhf.prod-runtime.all-hands.dev)

![ExpenseXpert Dashboard](https://img.shields.io/badge/Status-Live-brightgreen)
![Next.js](https://img.shields.io/badge/Next.js-15.3.3-black)
![React](https://img.shields.io/badge/React-19-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![Express.js](https://img.shields.io/badge/Express.js-4.18.0-green)
![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-green)

## 🚀 Features

### ✅ Completed Features
- **User Authentication**: Secure JWT-based registration and login
- **Dark/Light Theme UI**: Modern interface with shadcn/ui components and theme toggle
- **Dashboard**: Overview with financial stats and recent transactions
- **Transaction Management**: Add, edit, and delete income/expense transactions
- **Data Visualization**: Interactive charts and graphs with Recharts
- **Analytics**: Comprehensive spending trends and category analysis
- **Budget Management**: Create, track, and manage budgets with progress indicators
- **Settings**: User profile management, notifications, data export/import
- **Responsive Design**: Mobile-first design with Tailwind CSS
- **Form Validation**: Client-side validation with react-hook-form and zod
- **API Integration**: RESTful API with error handling and interceptors
- **Security**: Password hashing, JWT tokens, and protected routes

### 🎯 Key Features
- **Real-time Updates**: Live transaction updates and chart refreshes
- **Category Filtering**: Filter transactions by category, date, and type
- **Time Range Analysis**: View data for 7 days, 30 days, 90 days, or 1 year
- **Budget Tracking**: Visual progress bars and status indicators
- **Data Export**: Export transactions and financial data
- **Theme Persistence**: Remember user's theme preference

### 📋 Future Enhancements
- **Recurring Transactions**: Automated transaction entries
- **Email Reports**: Monthly financial summaries
- **PWA Support**: Installable web app
- **Advanced Analytics**: Predictive insights and trends

## 🛠️ Tech Stack

### Frontend
- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui
- **Charts**: Recharts
- **Forms**: react-hook-form with zod validation
- **State Management**: React Context API
- **HTTP Client**: Axios with interceptors

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js 4.18.0
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT (JSON Web Tokens)
- **Security**: bcryptjs, helmet, CORS
- **Validation**: express-validator
- **Logging**: Morgan

### Development Tools
- **Package Manager**: npm
- **Development**: nodemon, Turbopack
- **Linting**: ESLint
- **Git Hooks**: Husky (planned)

## 📁 Project Structure

```
personal-finance-tracker/
├── client/                 # Next.js Frontend
│   ├── src/
│   │   ├── app/           # App Router pages
│   │   ├── components/    # Reusable UI components
│   │   ├── contexts/      # React Context providers
│   │   ├── lib/          # Utilities and API clients
│   │   └── types/        # TypeScript type definitions
│   ├── public/           # Static assets
│   └── package.json
├── server/                # Express.js Backend
│   ├── controllers/      # Route controllers
│   ├── middleware/       # Custom middleware
│   ├── models/          # Mongoose schemas
│   ├── routes/          # API routes
│   ├── config/          # Database configuration
│   └── package.json
└── README.md
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm
- MongoDB Atlas account (or local MongoDB)
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/pari-cloud/finance-tracker.git
   cd personal-finance-tracker
   ```

2. **Set up the backend**
   ```bash
   cd server
   npm install
   ```

3. **Configure environment variables**
   Create `.env` file in the server directory:
   ```env
   # Database
   MONGODB_URI=your_mongodb_connection_string
   DB_NAME=ExpenceXpert

   # JWT
   JWT_SECRET=your_jwt_secret_key
   JWT_EXPIRES_IN=7d

   # Server
   PORT=5000
   NODE_ENV=development
   ```

4. **Set up the frontend**
   ```bash
   cd ../client
   npm install
   ```

5. **Configure frontend environment**
   Create `.env.local` file in the client directory:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:5000/api
   ```

### Running the Application

1. **Start the backend server**
   ```bash
   cd server
   npm run dev
   ```
   Server will run on http://localhost:5000

2. **Start the frontend development server**
   ```bash
   cd client
   npm run dev
   ```
   Frontend will run on http://localhost:3000

3. **Access the application**
   Open your browser and navigate to http://localhost:3000

## 📱 Usage

### User Registration
1. Navigate to the registration page
2. Fill in your details (name, email, password)
3. Password must contain uppercase, lowercase, and numbers
4. Click "Create Account" to register

### Dashboard Overview
- **Total Balance**: Current financial balance
- **Total Income**: Sum of all income transactions
- **Total Expenses**: Sum of all expense transactions
- **Savings Rate**: Percentage of income saved
- **Recent Transactions**: Latest financial activities
- **Quick Actions**: Common tasks and shortcuts

### Navigation
- **Dashboard**: Financial overview and stats
- **Transactions**: Manage income and expenses
- **Analytics**: Charts and spending insights
- **Settings**: Account and app preferences

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout

### Transactions
- `GET /api/transactions` - Get user transactions
- `POST /api/transactions` - Create new transaction
- `PUT /api/transactions/:id` - Update transaction
- `DELETE /api/transactions/:id` - Delete transaction
- `GET /api/transactions/summary` - Get financial summary

### Users
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update user profile
- `GET /api/users/dashboard-stats` - Get dashboard statistics

## 🎨 UI Components

Built with shadcn/ui components:
- **Forms**: Input, Button, Label, Textarea
- **Layout**: Card, Sheet, Separator
- **Navigation**: Dropdown Menu, Breadcrumb
- **Feedback**: Toast, Alert, Badge, Skeleton
- **Data Display**: Table, Avatar, Progress

## 🔒 Security Features

- **Password Hashing**: bcryptjs with salt rounds
- **JWT Authentication**: Secure token-based auth
- **Protected Routes**: Middleware for route protection
- **Input Validation**: Server-side validation with express-validator
- **CORS Configuration**: Cross-origin request handling
- **Helmet**: Security headers and protection

## 🚀 Deployment

### Frontend (Vercel)
1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Backend (Railway/Render)
1. Connect your GitHub repository
2. Set environment variables
3. Configure build and start commands
4. Deploy with automatic SSL

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 Development Roadmap

### Week 1 (Days 1-7) ✅
- [x] Project setup and structure
- [x] Authentication system
- [x] Basic UI components
- [x] Dashboard layout
- [x] API integration

### Week 2 (Days 8-14) ✅
- [x] Transaction CRUD operations
- [x] Charts and data visualization
- [x] Analytics and insights
- [x] Budget management
- [x] Settings and user preferences
- [x] Theme toggle functionality
- [x] Export functionality
- [x] Testing and deployment

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [shadcn/ui](https://ui.shadcn.com/) for the beautiful UI components
- [Tailwind CSS](https://tailwindcss.com/) for the utility-first CSS framework
- [Next.js](https://nextjs.org/) for the React framework
- [Express.js](https://expressjs.com/) for the backend framework
- [MongoDB](https://www.mongodb.com/) for the database solution

## 📞 Support

If you have any questions or need help, please open an issue on GitHub or contact the development team.

---

**ExpenseXpert** - Take control of your finances with style! 💰✨