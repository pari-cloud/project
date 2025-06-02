#!/bin/bash

echo "🚀 ExpenseXpert Local Setup Script"
echo "=================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

print_status "Node.js version: $(node --version)"

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    print_error "npm is not installed. Please install npm first."
    exit 1
fi

print_status "npm version: $(npm --version)"

# Create environment files if they don't exist
echo ""
echo "📝 Setting up environment files..."

# Backend .env
if [ ! -f "server/.env" ]; then
    print_warning "Creating server/.env file..."
    cat > server/.env << EOL
# Database Configuration
MONGODB_URI=mongodb://localhost:27017/ExpenceXpert
DB_NAME=ExpenceXpert

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
JWT_EXPIRES_IN=7d

# Server Configuration
PORT=5000
NODE_ENV=development

# CORS
CORS_ORIGIN=http://localhost:3000
EOL
    print_status "Created server/.env"
else
    print_status "server/.env already exists"
fi

# Frontend .env.local
if [ ! -f "client/.env.local" ]; then
    print_warning "Creating client/.env.local file..."
    cat > client/.env.local << EOL
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:5000/api

# App Configuration
NEXT_PUBLIC_APP_NAME=ExpenseXpert
NEXT_PUBLIC_APP_VERSION=1.0.0
EOL
    print_status "Created client/.env.local"
else
    print_status "client/.env.local already exists"
fi

# Install backend dependencies
echo ""
echo "📦 Installing backend dependencies..."
cd server
if npm install; then
    print_status "Backend dependencies installed"
else
    print_error "Failed to install backend dependencies"
    exit 1
fi

# Install frontend dependencies
echo ""
echo "📦 Installing frontend dependencies..."
cd ../client
if npm install; then
    print_status "Frontend dependencies installed"
else
    print_error "Failed to install frontend dependencies"
    exit 1
fi

cd ..

# Check if MongoDB is running (for local MongoDB)
echo ""
echo "🔍 Checking MongoDB connection..."

# Test MongoDB connection
if command -v mongosh &> /dev/null; then
    if mongosh --eval "db.runCommand('ping')" --quiet &> /dev/null; then
        print_status "Local MongoDB is running"
    else
        print_warning "Local MongoDB is not running or not accessible"
        echo "If using MongoDB Atlas, make sure your connection string is correct in server/.env"
    fi
elif command -v mongo &> /dev/null; then
    if mongo --eval "db.runCommand('ping')" --quiet &> /dev/null; then
        print_status "Local MongoDB is running"
    else
        print_warning "Local MongoDB is not running or not accessible"
        echo "If using MongoDB Atlas, make sure your connection string is correct in server/.env"
    fi
else
    print_warning "MongoDB CLI not found. If using MongoDB Atlas, that's fine."
fi

# Create start scripts
echo ""
echo "📝 Creating start scripts..."

# Backend start script
cat > start-backend.sh << 'EOL'
#!/bin/bash
echo "🚀 Starting ExpenseXpert Backend..."
cd server
npm run dev
EOL

# Frontend start script
cat > start-frontend.sh << 'EOL'
#!/bin/bash
echo "🚀 Starting ExpenseXpert Frontend..."
cd client
npm run dev
EOL

# Make scripts executable
chmod +x start-backend.sh
chmod +x start-frontend.sh

print_status "Created start scripts"

# Create test script
cat > test-connection.js << 'EOL'
const axios = require('axios');

async function testConnection() {
  console.log('🔍 Testing backend connection...');
  
  try {
    const response = await axios.get('http://localhost:5000/api/health', {
      timeout: 5000
    });
    console.log('✅ Backend is running:', response.data);
    return true;
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      console.log('❌ Backend server is not running on port 5000');
      console.log('   Run: ./start-backend.sh');
    } else if (error.code === 'ENOTFOUND') {
      console.log('❌ Cannot resolve localhost');
    } else {
      console.log('❌ Backend connection failed:', error.message);
    }
    return false;
  }
}

testConnection();
EOL

print_status "Created test-connection.js"

echo ""
echo "🎉 Setup Complete!"
echo "=================="
echo ""
echo "Next steps:"
echo "1. Update your MongoDB connection string in server/.env"
echo "2. Start the backend server:"
echo "   ${GREEN}./start-backend.sh${NC}"
echo ""
echo "3. In a new terminal, start the frontend:"
echo "   ${GREEN}./start-frontend.sh${NC}"
echo ""
echo "4. Test the connection:"
echo "   ${GREEN}node test-connection.js${NC}"
echo ""
echo "5. Open your browser to:"
echo "   ${GREEN}http://localhost:3000${NC}"
echo ""
echo "📚 If you encounter issues, check TROUBLESHOOTING.md"
echo ""
print_warning "Don't forget to update your MongoDB connection string in server/.env!"