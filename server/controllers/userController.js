import User from '../models/User.js';
import Transaction from '../models/Transaction.js';

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      data: user.profile
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching profile'
    });
  }
};

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
export const updateProfile = async (req, res) => {
  try {
    const { name, email, preferences, avatar } = req.body;

    // Check if email is being changed and if it's already taken
    if (email && email !== req.user.email) {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Email is already taken'
        });
      }
    }

    const updateData = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (avatar) updateData.avatar = avatar;
    if (preferences) updateData.preferences = { ...req.user.preferences, ...preferences };

    const user = await User.findByIdAndUpdate(
      req.user.id,
      updateData,
      {
        new: true,
        runValidators: true
      }
    );

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: user.profile
    });
  } catch (error) {
    console.error('Update profile error:', error);
    
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
      message: 'Server error updating profile'
    });
  }
};

// @desc    Change password
// @route   PUT /api/users/change-password
// @access  Private
export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    // Get user with password
    const user = await User.findById(req.user.id).select('+password');

    // Check current password
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error changing password'
    });
  }
};

// @desc    Delete user account
// @route   DELETE /api/users/account
// @access  Private
export const deleteAccount = async (req, res) => {
  try {
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({
        success: false,
        message: 'Password is required to delete account'
      });
    }

    // Get user with password
    const user = await User.findById(req.user.id).select('+password');

    // Verify password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Password is incorrect'
      });
    }

    // Delete all user transactions
    await Transaction.deleteMany({ user: req.user.id });

    // Delete user account
    await User.findByIdAndDelete(req.user.id);

    res.status(200).json({
      success: true,
      message: 'Account deleted successfully'
    });
  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error deleting account'
    });
  }
};

// @desc    Get user dashboard stats
// @route   GET /api/users/dashboard
// @access  Private
export const getDashboardStats = async (req, res) => {
  try {
    const userId = req.user.id;
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfYear = new Date(now.getFullYear(), 0, 1);

    // Get current month summary
    const monthlyStats = await Transaction.getUserSummary(userId, startOfMonth, now);
    
    // Get yearly summary
    const yearlyStats = await Transaction.getUserSummary(userId, startOfYear, now);
    
    // Get recent transactions
    const recentTransactions = await Transaction.find({ user: userId })
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    // Get top categories for current month
    const topExpenseCategories = await Transaction.getCategoryBreakdown(userId, 'expense', startOfMonth, now);
    const topIncomeCategories = await Transaction.getCategoryBreakdown(userId, 'income', startOfMonth, now);

    // Format stats
    const formatStats = (stats) => {
      const formatted = { income: 0, expense: 0, balance: 0, count: 0 };
      stats.forEach(item => {
        if (item._id === 'income') {
          formatted.income = item.total;
          formatted.count += item.count;
        } else if (item._id === 'expense') {
          formatted.expense = item.total;
          formatted.count += item.count;
        }
      });
      formatted.balance = formatted.income - formatted.expense;
      return formatted;
    };

    const dashboardData = {
      monthly: formatStats(monthlyStats),
      yearly: formatStats(yearlyStats),
      recentTransactions,
      topCategories: {
        expense: topExpenseCategories.slice(0, 5),
        income: topIncomeCategories.slice(0, 5)
      },
      user: req.user.profile
    };

    res.status(200).json({
      success: true,
      data: dashboardData
    });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching dashboard stats'
    });
  }
};

// @desc    Export user data
// @route   GET /api/users/export
// @access  Private
export const exportUserData = async (req, res) => {
  try {
    const { format = 'json', startDate, endDate } = req.query;

    // Build query for transactions
    const query = { user: req.user.id };
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    // Get user data
    const [user, transactions] = await Promise.all([
      User.findById(req.user.id),
      Transaction.find(query).sort({ date: -1 }).lean()
    ]);

    const exportData = {
      user: user.profile,
      transactions,
      exportDate: new Date().toISOString(),
      totalTransactions: transactions.length
    };

    if (format === 'csv') {
      // Convert to CSV format
      const csvHeaders = [
        'Date', 'Type', 'Amount', 'Category', 'Description', 
        'Payment Method', 'Location', 'Notes'
      ];
      
      const csvRows = transactions.map(t => [
        new Date(t.date).toLocaleDateString(),
        t.type,
        t.amount,
        t.category,
        t.description || '',
        t.paymentMethod || '',
        t.location || '',
        t.notes || ''
      ]);

      const csvContent = [csvHeaders, ...csvRows]
        .map(row => row.map(field => `"${field}"`).join(','))
        .join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=transactions.csv');
      return res.send(csvContent);
    }

    // Default JSON format
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename=user-data.json');
    res.status(200).json(exportData);
  } catch (error) {
    console.error('Export user data error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error exporting data'
    });
  }
};