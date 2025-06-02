import express from 'express';
import {
  getTransactions,
  getTransaction,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  getTransactionSummary,
  getCategoryBreakdown,
  getMonthlyTrends,
  bulkDeleteTransactions
} from '../controllers/transactionController.js';
import { protect } from '../middleware/auth.js';
import { validateTransaction } from '../middleware/validation.js';

const router = express.Router();

// All routes are protected
router.use(protect);

// Analytics routes (specific routes first)
router.get('/analytics/summary', getTransactionSummary);
router.get('/analytics/categories/:type', getCategoryBreakdown);
router.get('/analytics/trends', getMonthlyTrends);

// Bulk operations
router.delete('/bulk/delete', bulkDeleteTransactions);

// Transaction CRUD routes
router.route('/')
  .get(getTransactions)
  .post(validateTransaction, createTransaction);

router.route('/:id')
  .get(getTransaction)
  .put(validateTransaction, updateTransaction)
  .delete(deleteTransaction);

export default router;