const Book = require('../models/bookModel');
const Member = require('../models/memberModel');
const Borrow = require('../models/borrowModel');
const db = require('../config/db');

const dashboardController = {
    getDashboard: async (req, res) => {
        try {
            // Get basic statistics
            const [
                totalBooks,
                totalMembers,
                availableBooks,
                currentBorrowings,
                memberStats,
                overdueBooks,
                popularBooks,
                recentTransactions,
                borrowingStats
            ] = await Promise.all([
                Book.getTotalBooks(),
                Member.getTotalMembers(),
                new Promise((resolve, reject) => {
                    db.query('SELECT COUNT(*) as count FROM vw_available_books', (err, results) => {
                        if (err) return reject(err);
                        resolve(results[0].count);
                    });
                }),
                new Promise((resolve, reject) => {
                    db.query('SELECT COUNT(*) as count FROM vw_current_borrowings', (err, results) => {
                        if (err) return reject(err);
                        resolve(results[0].count);
                    });
                }),
                new Promise((resolve, reject) => {
                    db.query('SELECT * FROM vw_member_statistics LIMIT 10', (err, results) => {
                        if (err) return reject(err);
                        resolve(results);
                    });
                }),
                new Promise((resolve, reject) => {
                    db.query('SELECT COUNT(*) as count FROM vw_overdue_books', (err, results) => {
                        if (err) return reject(err);
                        resolve(results[0].count);
                    });
                }),
                Borrow.getPopularBooks(5),
                Borrow.getRecentTransactions(10),
                Borrow.getBorrowingStatistics()
            ]);

            // Get monthly statistics (last 6 months)
            const monthlyStats = await new Promise((resolve, reject) => {
                const query = `
                    SELECT 
                        DATE_FORMAT(borrow_date, '%Y-%m') as month,
                        COUNT(*) as total_borrowed,
                        COUNT(CASE WHEN return_date IS NOT NULL THEN 1 END) as total_returned
                    FROM borrow_transactions 
                    WHERE borrow_date >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
                    GROUP BY DATE_FORMAT(borrow_date, '%Y-%m')
                    ORDER BY month DESC
                `;
                db.query(query, (err, results) => {
                    if (err) return reject(err);
                    resolve(results);
                });
            });

            // Get genre statistics
            const genreStats = await new Promise((resolve, reject) => {
                const query = `
                    SELECT 
                        b.genre,
                        COUNT(bt.id) as borrow_count,
                        COUNT(DISTINCT b.id) as unique_books
                    FROM books b
                    LEFT JOIN borrow_transactions bt ON b.id = bt.book_id
                    GROUP BY b.genre
                    ORDER BY borrow_count DESC
                    LIMIT 8
                `;
                db.query(query, (err, results) => {
                    if (err) return reject(err);
                    resolve(results);
                });
            });

            res.render('dashboard', {
                title: 'Library Dashboard',
                totalBooks,
                totalMembers,
                availableBooks,
                currentBorrowings,
                overdueBooks,
                popularBooks,
                recentTransactions,
                monthlyStats,
                genreStats,
                memberStats,
                borrowingStats
            });
        } catch (error) {
            console.error('Dashboard error:', error);
            res.status(500).render('error', { 
                title: 'Error',
                message: 'Error loading dashboard data',
                error: error.message 
            });
        }
    }
};

module.exports = dashboardController;