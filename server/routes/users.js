import express from 'express';
import {
  getProfile,
  updateProfile,
  changePassword,
  deleteAccount,
  getDashboardStats,
  exportUserData
} from '../controllers/userController.js';
import { protect } from '../middleware/auth.js';
import { validateUpdateProfile, validateChangePassword } from '../middleware/validation.js';

const router = express.Router();

// All routes are protected
router.use(protect);

// Profile routes
router.route('/profile')
  .get(getProfile)
  .put(validateUpdateProfile, updateProfile);

// Account management
router.put('/change-password', validateChangePassword, changePassword);
router.delete('/account', deleteAccount);

// Dashboard and analytics
router.get('/dashboard', getDashboardStats);
router.get('/export', exportUserData);

export default router;