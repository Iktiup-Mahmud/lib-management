const express = require('express');
const router = express.Router();
const borrowController = require('../controllers/borrowController');

// Enhanced transaction dashboard
router.get('/dashboard', borrowController.showTransactionDashboard);

// Route to list all borrow transactions with advanced filtering
router.get('/', borrowController.listBorrowedBooks);

// Route to show issue book form
router.get('/issue', borrowController.showIssueForm);

// Route to show return book form
router.get('/return', borrowController.showReturnForm);

// Individual transaction details
router.get('/transaction/:id', borrowController.getTransactionDetails);

// Transaction analytics and reports
router.get('/analytics', borrowController.getTransactionAnalytics);

// Export transactions
router.get('/export', borrowController.exportTransactions);

// Route to issue a book
router.post('/issue', borrowController.issueBook);

// Route to return a book
router.post('/return', borrowController.returnBook);

// Route to return a book by transaction ID
router.post('/return/:id', borrowController.returnBook);

// Bulk operations for transactions
router.post('/bulk', borrowController.processBulkOperations);

// Route to get currently borrowed books (using model directly)
router.get('/current', async (req, res) => {
    try {
        const Borrow = require('../models/borrowModel');
        const currentBorrows = await Borrow.getCurrentlyBorrowedBooks();
        res.render('borrow/current', {
            currentBorrows,
            title: 'Currently Borrowed Books'
        });
    } catch (error) {
        console.error('Error retrieving currently borrowed books:', error);
        res.status(500).render('error', { 
            message: 'Error retrieving currently borrowed books', 
            error 
        });
    }
});

// API route for borrowing statistics
router.get('/api/statistics', async (req, res) => {
    try {
        const Borrow = require('../models/borrowModel');
        const stats = await Borrow.getTransactionStatistics();
        res.json(stats);
    } catch (error) {
        console.error('Error retrieving statistics:', error);
        res.status(500).json({ 
            message: 'Error retrieving statistics', 
            error: error.message 
        });
    }
});

// Route for popular books report
router.get('/reports/popular', async (req, res) => {
    try {
        const Borrow = require('../models/borrowModel');
        const popularBooks = await Borrow.getPopularBooks(10);
        res.render('borrow/popular', {
            popularBooks,
            title: 'Popular Books Report'
        });
    } catch (error) {
        console.error('Error retrieving popular books:', error);
        res.status(500).render('error', { 
            message: 'Error retrieving popular books', 
            error 
        });
    }
});

module.exports = router;