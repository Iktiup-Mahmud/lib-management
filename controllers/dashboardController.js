const db = require('../config/db');
const Book = require('../models/bookModel');
const Member = require('../models/memberModel');
const Borrow = require('../models/borrowModel');

const dashboardController = {
    // Main dashboard with comprehensive statistics
    renderDashboard: async (req, res) => {
        try {
            // Get comprehensive statistics using views and aggregations
            const statsQuery = `
                SELECT 
                    (SELECT COUNT(*) FROM books) as totalBooks,
                    (SELECT COUNT(*) FROM members WHERE is_active = TRUE) as totalMembers,
                    (SELECT COUNT(*) FROM borrow_transactions WHERE return_date IS NULL) as currentlyBorrowed,
                    (SELECT COUNT(*) FROM vw_overdue_books) as overdueBooks,
                    (SELECT COALESCE(SUM(fine_amount), 0) FROM borrow_transactions) as totalFines,
                    (SELECT COUNT(*) FROM borrow_transactions WHERE DATE(borrow_date) = CURDATE()) as todayBorrows,
                    (SELECT COUNT(*) FROM borrow_transactions WHERE DATE(return_date) = CURDATE()) as todayReturns,
                    (SELECT COUNT(DISTINCT member_id) FROM borrow_transactions WHERE MONTH(borrow_date) = MONTH(NOW()) AND YEAR(borrow_date) = YEAR(NOW())) as activeThisMonth
            `;

            const [stats] = await new Promise((resolve, reject) => {
                db.query(statsQuery, (error, results) => {
                    if (error) return reject(error);
                    resolve(results);
                });
            });

            // Get popular books using our model
            const popularBooks = await Borrow.getPopularBooks(5);
            
            // Get recent transactions with member and book details (JOIN query)
            const recentTransactionsQuery = `
                SELECT 
                    bt.id,
                    bt.borrow_date,
                    bt.return_date,
                    bt.status,
                    m.name as member_name,
                    b.title as book_title,
                    b.author as book_author,
                    CASE 
                        WHEN bt.due_date < NOW() AND bt.return_date IS NULL THEN 'Overdue'
                        WHEN bt.return_date IS NULL THEN 'Borrowed'
                        ELSE 'Returned'
                    END as transaction_status
                FROM borrow_transactions bt
                INNER JOIN members m ON bt.member_id = m.id
                INNER JOIN books b ON bt.book_id = b.id
                ORDER BY bt.borrow_date DESC
                LIMIT 10
            `;

            const recentTransactions = await new Promise((resolve, reject) => {
                db.query(recentTransactionsQuery, (error, results) => {
                    if (error) return reject(error);
                    resolve(results);
                });
            });

            // Get monthly statistics from view
            const monthlyStatsQuery = `
                SELECT * FROM vw_monthly_statistics 
                WHERE borrow_year = YEAR(NOW()) 
                ORDER BY borrow_month DESC 
                LIMIT 6
            `;

            const monthlyStats = await new Promise((resolve, reject) => {
                db.query(monthlyStatsQuery, (error, results) => {
                    if (error) return reject(error);
                    resolve(results);
                });
            });

            // Get genre-wise book distribution
            const genreStatsQuery = `
                SELECT * FROM vw_book_availability_by_genre
                ORDER BY total_books DESC
                LIMIT 8
            `;

            const genreStats = await new Promise((resolve, reject) => {
                db.query(genreStatsQuery, (error, results) => {
                    if (error) return reject(error);
                    resolve(results);
                });
            });

            res.render('dashboard', {
                stats,
                popularBooks,
                recentTransactions,
                monthlyStats,
                genreStats,
                title: 'Library Dashboard'
            });

        } catch (error) {
            console.error('Dashboard error:', error);
            res.status(500).render('error', { 
                message: 'Error loading dashboard',
                error: error 
            });
        }
    },

    // API endpoint for statistics (AGGREGATION functions)
    getStatistics: async (req, res) => {
        try {
            const borrowStats = await Borrow.getBorrowingStatistics();
            
            // Additional complex query with multiple joins and aggregations
            const detailedStatsQuery = `
                SELECT 
                    COUNT(DISTINCT b.id) as unique_books,
                    COUNT(DISTINCT m.id) as unique_members,
                    COUNT(bt.id) as total_transactions,
                    COUNT(CASE WHEN bt.return_date IS NULL THEN 1 END) as active_borrows,
                    COUNT(CASE WHEN bt.return_date IS NOT NULL THEN 1 END) as completed_borrows,
                    COUNT(CASE WHEN bt.status = 'OVERDUE' THEN 1 END) as overdue_count,
                    AVG(DATEDIFF(COALESCE(bt.return_date, NOW()), bt.borrow_date)) as avg_borrow_days,
                    MAX(bt.borrow_date) as last_transaction,
                    MIN(bt.borrow_date) as first_transaction,
                    SUM(bt.fine_amount) as total_fines_collected,
                    COUNT(DISTINCT DATE(bt.borrow_date)) as active_days,
                    (SELECT genre FROM books b2 
                     JOIN borrow_transactions bt2 ON b2.id = bt2.book_id 
                     GROUP BY b2.genre 
                     ORDER BY COUNT(*) DESC 
                     LIMIT 1) as most_popular_genre
                FROM books b
                CROSS JOIN members m
                LEFT JOIN borrow_transactions bt ON (b.id = bt.book_id OR m.id = bt.member_id)
            `;

            const [detailedStats] = await new Promise((resolve, reject) => {
                db.query(detailedStatsQuery, (error, results) => {
                    if (error) return reject(error);
                    resolve(results);
                });
            });

            res.json({
                borrowingStats: borrowStats,
                detailedStats: detailedStats,
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            console.error('Statistics API error:', error);
            res.status(500).json({ 
                message: 'Error retrieving statistics', 
                error: error.message 
            });
        }
    },

    // Get overdue report using view
    getOverdueReport: async (req, res) => {
        try {
            const overdueQuery = `SELECT * FROM vw_overdue_books ORDER BY days_overdue DESC`;
            
            const overdueBooks = await new Promise((resolve, reject) => {
                db.query(overdueQuery, (error, results) => {
                    if (error) return reject(error);
                    resolve(results);
                });
            });

            res.render('reports/overdue', {
                overdueBooks,
                title: 'Overdue Books Report',
                reportDate: new Date()
            });

        } catch (error) {
            console.error('Overdue report error:', error);
            res.status(500).render('error', { 
                message: 'Error loading overdue report',
                error: error 
            });
        }
    },

    // Popular books report using complex query
    getPopularBooksReport: async (req, res) => {
        try {
            const popularBooks = await new Promise((resolve, reject) => {
                db.query('SELECT * FROM vw_popular_books LIMIT 20', (error, results) => {
                    if (error) return reject(error);
                    resolve(results);
                });
            });

            res.render('reports/popular-books', {
                popularBooks,
                title: 'Popular Books Report',
                reportDate: new Date()
            });

        } catch (error) {
            console.error('Popular books report error:', error);
            res.status(500).render('error', { 
                message: 'Error loading popular books report',
                error: error 
            });
        }
    }
};

module.exports = dashboardController;