#!/bin/bash

echo "🔧 ExpenseXpert Network Error Fix"
echo "================================="

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_step() {
    echo -e "${BLUE}📋 Step $1: $2${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_step 1 "Checking if backend server is running"

# Check if backend is running on port 5000
if curl -s http://localhost:5000/api/health > /dev/null 2>&1; then
    print_success "Backend server is running on port 5000"
else
    print_error "Backend server is NOT running on port 5000"
    echo ""
    echo "To fix this:"
    echo "1. Open a new terminal"
    echo "2. Navigate to your project directory"
    echo "3. Run: cd server && npm run dev"
    echo ""
    echo "Or use the start script: ./start-backend.sh"
    echo ""
    exit 1
fi

print_step 2 "Checking frontend environment configuration"

# Check if .env.local exists
if [ -f "client/.env.local" ]; then
    print_success "client/.env.local exists"
    
    # Check if it has the correct API URL
    if grep -q "NEXT_PUBLIC_API_URL=http://localhost:5000/api" client/.env.local; then
        print_success "API URL is correctly configured"
    else
        print_warning "API URL might be incorrect"
        echo "Current content of client/.env.local:"
        cat client/.env.local
        echo ""
        echo "Expected: NEXT_PUBLIC_API_URL=http://localhost:5000/api"
    fi
else
    print_warning "client/.env.local does not exist"
    echo "Creating client/.env.local..."
    
    cat > client/.env.local << EOL
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:5000/api

# App Configuration
NEXT_PUBLIC_APP_NAME=ExpenseXpert
NEXT_PUBLIC_APP_VERSION=1.0.0
EOL
    
    print_success "Created client/.env.local"
fi

print_step 3 "Testing API connection"

# Test the health endpoint
echo "Testing: curl http://localhost:5000/api/health"
HEALTH_RESPONSE=$(curl -s http://localhost:5000/api/health)

if [ $? -eq 0 ]; then
    print_success "API health check passed"
    echo "Response: $HEALTH_RESPONSE"
else
    print_error "API health check failed"
    exit 1
fi

print_step 4 "Testing login endpoint"

# Test login endpoint (should return 400 for missing credentials)
echo "Testing: curl -X POST http://localhost:5000/api/auth/login"
LOGIN_RESPONSE=$(curl -s -w "%{http_code}" -X POST http://localhost:5000/api/auth/login -H "Content-Type: application/json" -d '{}')
HTTP_CODE="${LOGIN_RESPONSE: -3}"

if [ "$HTTP_CODE" = "400" ]; then
    print_success "Login endpoint is responding (400 expected for empty request)"
elif [ "$HTTP_CODE" = "422" ]; then
    print_success "Login endpoint is responding (422 expected for validation error)"
else
    print_warning "Login endpoint returned unexpected status: $HTTP_CODE"
fi

print_step 5 "Checking for port conflicts"

# Check what's running on port 5000
PORT_CHECK=$(lsof -i :5000 2>/dev/null)
if [ -n "$PORT_CHECK" ]; then
    print_success "Port 5000 is in use (good - backend should be running)"
    echo "Process details:"
    echo "$PORT_CHECK"
else
    print_error "Nothing is running on port 5000"
    echo "Start your backend server: cd server && npm run dev"
fi

print_step 6 "Final recommendations"

echo ""
echo "🎯 Quick Fix Checklist:"
echo "======================"
echo ""
echo "1. ✅ Make sure backend is running:"
echo "   cd server && npm run dev"
echo ""
echo "2. ✅ Make sure frontend has correct API URL:"
echo "   Check client/.env.local contains: NEXT_PUBLIC_API_URL=http://localhost:5000/api"
echo ""
echo "3. ✅ Restart frontend after changing .env.local:"
echo "   cd client && npm run dev"
echo ""
echo "4. ✅ Clear browser cache and try again"
echo ""
echo "5. ✅ Check browser console for detailed error messages"
echo ""

# Check if frontend is running
if curl -s http://localhost:3000 > /dev/null 2>&1; then
    print_success "Frontend appears to be running on port 3000"
    echo "🌐 Open: http://localhost:3000"
else
    print_warning "Frontend doesn't appear to be running on port 3000"
    echo "Start frontend: cd client && npm run dev"
fi

echo ""
echo "🔍 If you're still having issues:"
echo "1. Check the browser's Network tab in Developer Tools"
echo "2. Look for the exact error message"
echo "3. Verify both servers are running in separate terminals"
echo "4. Try the test script: node test-connection.js"
echo ""
print_success "Network error diagnosis complete!"