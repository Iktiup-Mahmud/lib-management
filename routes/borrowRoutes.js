const express = require('express');
const router = express.Router();
const borrowController = require('../controllers/borrowController');

// Route to list all borrow transactions
router.get('/', borrowController.listBorrowedBooks);

// Route to show issue book form
router.get('/issue', borrowController.showIssueForm);

// Route to show return book form
router.get('/return', borrowController.showReturnForm);

// Route to get currently borrowed books
router.get('/current', borrowController.getCurrentlyBorrowedBooks);

// Route to issue a book
router.post('/issue', borrowController.issueBook);

// Route to return a book
router.post('/return', borrowController.returnBook);

// Route to return a book by transaction ID
router.post('/return/:id', borrowController.returnBook);

// API route for borrowing statistics
router.get('/api/statistics', borrowController.getBorrowingStatistics);

// Route for popular books report
router.get('/reports/popular', borrowController.getPopularBooks);

module.exports = router;