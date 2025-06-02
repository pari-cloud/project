# Troubleshooting Guide

## Network Error on Login (Local Development)

If you're getting a network error when trying to login locally, follow these steps:

### 1. Check Backend Server

First, make sure your backend server is running:

```bash
cd server
npm run dev
```

The server should start on `http://localhost:5000` and you should see:
```
Server running on port 5000
Connected to MongoDB
```

### 2. Verify Backend is Working

Test the backend API directly:

```bash
# Test health endpoint
curl http://localhost:5000/api/health

# Should return:
# {"message":"ExpenseXpert API is running!","timestamp":"..."}
```

### 3. Check Environment Variables

**Frontend (.env.local in client directory):**
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

**Backend (.env in server directory):**
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

### 4. Fix CORS Issues (if any)

If you're still getting CORS errors, make sure the backend CORS configuration allows your frontend URL. Check `server/index.js`:

```javascript
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true
}));
```

### 5. Common Port Conflicts

If port 5000 is already in use:

**Option A: Change Backend Port**
```bash
# In server/.env
PORT=5001
```

Then update frontend:
```bash
# In client/.env.local
NEXT_PUBLIC_API_URL=http://localhost:5001/api
```

**Option B: Kill Process on Port 5000**
```bash
# Find process using port 5000
lsof -i :5000

# Kill the process (replace PID with actual process ID)
kill -9 PID
```

### 6. Network Debugging

Check if the API is reachable:

```bash
# Test from command line
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

### 7. Browser Developer Tools

1. Open browser Developer Tools (F12)
2. Go to Network tab
3. Try to login
4. Check the failed request details
5. Look for the exact error message

### 8. Complete Reset

If nothing works, try a complete reset:

```bash
# Stop all servers
# Kill any node processes

# Backend
cd server
rm -rf node_modules
npm install
npm run dev

# Frontend (new terminal)
cd client
rm -rf node_modules
rm -rf .next
npm install
npm run dev
```

### 9. Alternative API Configuration

If you're still having issues, you can hardcode the API URL temporarily:

In `client/src/lib/api.ts`, change line 16:
```typescript
const API_BASE_URL = 'http://localhost:5000/api';
```

### 10. MongoDB Connection Issues

If the backend starts but can't connect to MongoDB:

1. **Using MongoDB Atlas:**
   - Check your connection string
   - Verify network access (whitelist your IP)
   - Ensure database user has correct permissions

2. **Using Local MongoDB:**
   ```bash
   # Start MongoDB service
   sudo systemctl start mongod
   
   # Or on macOS with Homebrew
   brew services start mongodb-community
   ```

### Quick Test Script

Create this test file to verify everything is working:

**test-connection.js:**
```javascript
const axios = require('axios');

async function testConnection() {
  try {
    const response = await axios.get('http://localhost:5000/api/health');
    console.log('✅ Backend is running:', response.data);
    
    // Test login endpoint
    const loginTest = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'test@example.com',
      password: 'wrongpassword'
    }).catch(err => err.response);
    
    if (loginTest.status === 400 || loginTest.status === 401) {
      console.log('✅ Login endpoint is responding');
    }
    
  } catch (error) {
    console.log('❌ Backend connection failed:', error.message);
    console.log('Make sure backend server is running on port 5000');
  }
}

testConnection();
```

Run with: `node test-connection.js`

## Still Having Issues?

If you're still experiencing problems:

1. Check the exact error message in browser console
2. Verify both servers are running on correct ports
3. Test API endpoints directly with curl or Postman
4. Check firewall/antivirus settings
5. Try running on a different port

## Common Error Messages

- **"Network Error"**: Backend server not running
- **"CORS Error"**: CORS configuration issue
- **"Connection Refused"**: Wrong port or server not started
- **"404 Not Found"**: Wrong API URL or endpoint
- **"500 Internal Server Error"**: Backend error, check server logs