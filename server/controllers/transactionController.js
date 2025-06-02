import Transaction from '../models/Transaction.js';
import mongoose from 'mongoose';

// @desc    Get all transactions for user
// @route   GET /api/transactions
// @access  Private
export const getTransactions = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      type,
      category,
      startDate,
      endDate,
      search,
      sortBy = 'date',
      sortOrder = 'desc'
    } = req.query;

    // Build query
    const query = { user: req.user.id };

    if (type && ['income', 'expense'].includes(type)) {
      query.type = type;
    }

    if (category) {
      query.category = { $regex: category, $options: 'i' };
    }

    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    if (search) {
      query.$or = [
        { description: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } },
        { notes: { $regex: search, $options: 'i' } }
      ];
    }

    // Sort options
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Execute query with pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const [transactions, total] = await Promise.all([
      Transaction.find(query)
        .sort(sortOptions)
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Transaction.countDocuments(query)
    ]);

    const totalPages = Math.ceil(total / parseInt(limit));

    res.status(200).json({
      success: true,
      data: transactions,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalItems: total,
        itemsPerPage: parseInt(limit),
        hasNextPage: parseInt(page) < totalPages,
        hasPrevPage: parseInt(page) > 1
      }
    });
  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching transactions'
    });
  }
};

// @desc    Get single transaction
// @route   GET /api/transactions/:id
// @access  Private
export const getTransaction = async (req, res) => {
  try {
    const transaction = await Transaction.findOne({
      _id: req.params.id,
      user: req.user.id
    });

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }

    res.status(200).json({
      success: true,
      data: transaction
    });
  } catch (error) {
    console.error('Get transaction error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching transaction'
    });
  }
};

// @desc    Create new transaction
// @route   POST /api/transactions
// @access  Private
export const createTransaction = async (req, res) => {
  try {
    const transactionData = {
      ...req.body,
      user: req.user.id
    };

    const transaction = await Transaction.create(transactionData);

    res.status(201).json({
      success: true,
      message: 'Transaction created successfully',
      data: transaction
    });
  } catch (error) {
    console.error('Create transaction error:', error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => ({
        field: err.path,
        message: err.message
      }));
      
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error creating transaction'
    });
  }
};

// @desc    Update transaction
// @route   PUT /api/transactions/:id
// @access  Private
export const updateTransaction = async (req, res) => {
  try {
    let transaction = await Transaction.findOne({
      _id: req.params.id,
      user: req.user.id
    });

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }

    transaction = await Transaction.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    );

    res.status(200).json({
      success: true,
      message: 'Transaction updated successfully',
      data: transaction
    });
  } catch (error) {
    console.error('Update transaction error:', error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => ({
        field: err.path,
        message: err.message
      }));
      
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error updating transaction'
    });
  }
};

// @desc    Delete transaction
// @route   DELETE /api/transactions/:id
// @access  Private
export const deleteTransaction = async (req, res) => {
  try {
    const transaction = await Transaction.findOne({
      _id: req.params.id,
      user: req.user.id
    });

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }

    await Transaction.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Transaction deleted successfully'
    });
  } catch (error) {
    console.error('Delete transaction error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error deleting transaction'
    });
  }
};

// @desc    Get transaction summary
// @route   GET /api/transactions/summary
// @access  Private
export const getTransactionSummary = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const summary = await Transaction.getUserSummary(req.user.id, startDate, endDate);
    
    // Format summary data
    const formattedSummary = {
      income: 0,
      expense: 0,
      balance: 0,
      incomeCount: 0,
      expenseCount: 0,
      totalTransactions: 0
    };

    summary.forEach(item => {
      if (item._id === 'income') {
        formattedSummary.income = item.total;
        formattedSummary.incomeCount = item.count;
      } else if (item._id === 'expense') {
        formattedSummary.expense = item.total;
        formattedSummary.expenseCount = item.count;
      }
    });

    formattedSummary.balance = formattedSummary.income - formattedSummary.expense;
    formattedSummary.totalTransactions = formattedSummary.incomeCount + formattedSummary.expenseCount;

    res.status(200).json({
      success: true,
      data: formattedSummary
    });
  } catch (error) {
    console.error('Get transaction summary error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching transaction summary'
    });
  }
};

// @desc    Get category breakdown
// @route   GET /api/transactions/categories/:type
// @access  Private
export const getCategoryBreakdown = async (req, res) => {
  try {
    const { type } = req.params;
    const { startDate, endDate } = req.query;

    if (!['income', 'expense'].includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Type must be either income or expense'
      });
    }

    const breakdown = await Transaction.getCategoryBreakdown(req.user.id, type, startDate, endDate);

    res.status(200).json({
      success: true,
      data: breakdown
    });
  } catch (error) {
    console.error('Get category breakdown error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching category breakdown'
    });
  }
};

// @desc    Get monthly trends
// @route   GET /api/transactions/trends
// @access  Private
export const getMonthlyTrends = async (req, res) => {
  try {
    const { months = 12 } = req.query;

    const trends = await Transaction.getMonthlyTrends(req.user.id, parseInt(months));

    res.status(200).json({
      success: true,
      data: trends
    });
  } catch (error) {
    console.error('Get monthly trends error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching monthly trends'
    });
  }
};

// @desc    Bulk delete transactions
// @route   DELETE /api/transactions/bulk
// @access  Private
export const bulkDeleteTransactions = async (req, res) => {
  try {
    const { transactionIds } = req.body;

    if (!Array.isArray(transactionIds) || transactionIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an array of transaction IDs'
      });
    }

    // Validate all IDs are valid ObjectIds
    const validIds = transactionIds.filter(id => mongoose.Types.ObjectId.isValid(id));
    
    if (validIds.length !== transactionIds.length) {
      return res.status(400).json({
        success: false,
        message: 'Some transaction IDs are invalid'
      });
    }

    const result = await Transaction.deleteMany({
      _id: { $in: validIds },
      user: req.user.id
    });

    res.status(200).json({
      success: true,
      message: `${result.deletedCount} transactions deleted successfully`,
      deletedCount: result.deletedCount
    });
  } catch (error) {
    console.error('Bulk delete transactions error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error deleting transactions'
    });
  }
};