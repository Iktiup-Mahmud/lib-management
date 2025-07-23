const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');

// Route to render the dashboard view
router.get('/', dashboardController.renderDashboard);

// Route to get statistics about books and members (API endpoint)
router.get('/api/stats', dashboardController.getStatistics);

// Route for overdue books report
router.get('/reports/overdue', dashboardController.getOverdueReport);

// Route for popular books report
router.get('/reports/popular-books', dashboardController.getPopularBooksReport);

module.exports = router;