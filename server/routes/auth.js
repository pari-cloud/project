import express from 'express';
import {
  register,
  login,
  logout,
  getMe,
  verifyToken,
  refreshToken
} from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';
import { validateRegister, validateLogin } from '../middleware/validation.js';

const router = express.Router();

// Public routes
router.post('/register', validateRegister, register);
router.post('/login', validateLogin, login);
router.get('/verify', verifyToken);

// Protected routes
router.use(protect); // All routes after this middleware are protected

router.post('/logout', logout);
router.get('/me', getMe);
router.post('/refresh', refreshToken);

export default router;