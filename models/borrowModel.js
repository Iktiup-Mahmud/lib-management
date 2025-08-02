const db = require('../config/db');

const Borrow = {
    // Enhanced issue book with custom due date and notes
    issueBook: (transactionData) => {
        return new Promise((resolve, reject) => {
            const dueDate = transactionData.due_date || 'DATE_ADD(NOW(), INTERVAL 14 DAY)';
            const query = `INSERT INTO borrow_transactions (member_id, book_id, borrow_date, due_date, notes) 
                          VALUES (?, ?, NOW(), ${transactionData.due_date ? '?' : dueDate}, ?)`;
            
            const params = transactionData.due_date 
                ? [transactionData.member_id, transactionData.book_id, transactionData.due_date, transactionData.notes || '']
                : [transactionData.member_id, transactionData.book_id, transactionData.notes || ''];

            db.query(query, params, (error, results) => {
                if (error) return reject(error);
                // Update book available copies
                const updateBookQuery = `UPDATE books SET available_copies = available_copies - 1 WHERE id = ? AND available_copies > 0`;
                db.query(updateBookQuery, [transactionData.book_id], (updateError, updateResults) => {
                    if (updateError) return reject(updateError);
                    if (updateResults.affectedRows === 0) {
                        return reject(new Error('Book not available for borrowing'));
                    }
                    resolve(results.insertId);
                });
            });
        });
    },

    // Enhanced return book with fine calculation
    returnBook: (returnData) => {
        return new Promise((resolve, reject) => {
            const { transaction_id, fine_amount = 0, condition = 'GOOD', notes = '' } = returnData;
            
            // First get the book_id from the transaction
            const getBookQuery = `SELECT book_id FROM borrow_transactions WHERE id = ? AND return_date IS NULL`;
            db.query(getBookQuery, [transaction_id], (error, results) => {
                if (error) return reject(error);
                if (results.length === 0) {
                    return reject(new Error('Transaction not found or book already returned'));
                }
                
                const bookId = results[0].book_id;
                
                // Update the transaction with return details
                const returnQuery = `UPDATE borrow_transactions 
                                   SET return_date = NOW(), fine_amount = ?, return_condition = ?, return_notes = ?
                                   WHERE id = ?`;
                db.query(returnQuery, [fine_amount, condition, notes, transaction_id], (returnError, returnResults) => {
                    if (returnError) return reject(returnError);
                    
                    // Update book available copies
                    const updateBookQuery = `UPDATE books SET available_copies = available_copies + 1 WHERE id = ?`;
                    db.query(updateBookQuery, [bookId], (updateError, updateResults) => {
                        if (updateError) return reject(updateError);
                        resolve(returnResults.affectedRows);
                    });
                });
            });
        });
    },

    // Get comprehensive transaction statistics
    getTransactionStatistics: () => {
        return new Promise((resolve, reject) => {
            const query = `
                SELECT 
                    COUNT(*) as total_transactions,
                    COUNT(CASE WHEN return_date IS NULL THEN 1 END) as active_transactions,
                    COUNT(CASE WHEN return_date IS NOT NULL THEN 1 END) as completed_transactions,
                    COUNT(CASE WHEN return_date IS NULL AND due_date < NOW() THEN 1 END) as overdue_transactions,
                    COALESCE(SUM(fine_amount), 0) as total_fines_collected,
                    AVG(DATEDIFF(COALESCE(return_date, NOW()), borrow_date)) as avg_borrow_duration,
                    COUNT(CASE WHEN DATE(borrow_date) = CURDATE() THEN 1 END) as today_issued,
                    COUNT(CASE WHEN DATE(return_date) = CURDATE() THEN 1 END) as today_returned,
                    COUNT(CASE WHEN WEEK(borrow_date) = WEEK(NOW()) AND YEAR(borrow_date) = YEAR(NOW()) THEN 1 END) as this_week_issued,
                    COUNT(CASE WHEN MONTH(borrow_date) = MONTH(NOW()) AND YEAR(borrow_date) = YEAR(NOW()) THEN 1 END) as this_month_issued
                FROM borrow_transactions
            `;
            db.query(query, (error, results) => {
                if (error) return reject(error);
                resolve(results[0]);
            });
        });
    },

    // Get recent transactions with full details
    getRecentTransactions: (limit = 10) => {
        return new Promise((resolve, reject) => {
            const query = `
                SELECT 
                    bt.id,
                    bt.borrow_date,
                    bt.due_date,
                    bt.return_date,
                    bt.fine_amount,
                    bt.notes,
                    m.name as member_name,
                    m.email as member_email,
                    b.title as book_title,
                    b.author as book_author,
                    b.isbn,
                    CASE 
                        WHEN bt.return_date IS NULL AND bt.due_date < NOW() THEN 'OVERDUE'
                        WHEN bt.return_date IS NULL THEN 'ACTIVE'
                        ELSE 'RETURNED'
                    END as status,
                    CASE 
                        WHEN bt.return_date IS NULL AND bt.due_date < NOW() 
                        THEN DATEDIFF(NOW(), bt.due_date)
                        ELSE 0
                    END as days_overdue
                FROM borrow_transactions bt
                INNER JOIN members m ON bt.member_id = m.id
                INNER JOIN books b ON bt.book_id = b.id
                ORDER BY bt.borrow_date DESC
                LIMIT ?
            `;
            db.query(query, [limit], (error, results) => {
                if (error) return reject(error);
                resolve(results);
            });
        });
    },

    // Get overdue transactions
    getOverdueTransactions: () => {
        return new Promise((resolve, reject) => {
            const query = `
                SELECT 
                    bt.id,
                    bt.borrow_date,
                    bt.due_date,
                    bt.fine_amount,
                    m.name as member_name,
                    m.email as member_email,
                    m.phone as member_phone,
                    b.title as book_title,
                    b.author as book_author,
                    DATEDIFF(NOW(), bt.due_date) as days_overdue,
                    DATEDIFF(NOW(), bt.due_date) * 1.00 as calculated_fine
                FROM borrow_transactions bt
                INNER JOIN members m ON bt.member_id = m.id
                INNER JOIN books b ON bt.book_id = b.id
                WHERE bt.return_date IS NULL AND bt.due_date < NOW()
                ORDER BY days_overdue DESC
            `;
            db.query(query, (error, results) => {
                if (error) return reject(error);
                resolve(results);
            });
        });
    },

    // Get monthly borrowing trends
    getMonthlyTrends: () => {
        return new Promise((resolve, reject) => {
            const query = `
                SELECT 
                    DATE_FORMAT(borrow_date, '%Y-%m') as month,
                    COUNT(*) as total_borrowed,
                    COUNT(CASE WHEN return_date IS NOT NULL THEN 1 END) as returned,
                    COUNT(CASE WHEN return_date IS NULL THEN 1 END) as still_active,
                    AVG(DATEDIFF(COALESCE(return_date, NOW()), borrow_date)) as avg_duration
                FROM borrow_transactions
                WHERE borrow_date >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
                GROUP BY DATE_FORMAT(borrow_date, '%Y-%m')
                ORDER BY month DESC
                LIMIT 12
            `;
            db.query(query, (error, results) => {
                if (error) return reject(error);
                resolve(results);
            });
        });
    },

    // Get top borrowers
    getTopBorrowers: (limit = 5) => {
        return new Promise((resolve, reject) => {
            const query = `
                SELECT 
                    m.id,
                    m.name,
                    m.email,
                    COUNT(bt.id) as total_borrowed,
                    COUNT(CASE WHEN bt.return_date IS NULL THEN 1 END) as currently_borrowed,
                    COUNT(CASE WHEN bt.return_date IS NULL AND bt.due_date < NOW() THEN 1 END) as overdue_count,
                    COALESCE(SUM(bt.fine_amount), 0) as total_fines,
                    MAX(bt.borrow_date) as last_borrow_date
                FROM members m
                LEFT JOIN borrow_transactions bt ON m.id = bt.member_id
                GROUP BY m.id, m.name, m.email
                HAVING total_borrowed > 0
                ORDER BY total_borrowed DESC, last_borrow_date DESC
                LIMIT ?
            `;
            db.query(query, [limit], (error, results) => {
                if (error) return reject(error);
                resolve(results);
            });
        });
    },

    // Advanced transaction filtering and search
    getTransactionsWithFilters: (filters) => {
        return new Promise((resolve, reject) => {
            let whereConditions = [];
            let queryParams = [];
            let baseQuery = `
                SELECT 
                    bt.id,
                    bt.borrow_date,
                    bt.due_date,
                    bt.return_date,
                    bt.fine_amount,
                    bt.notes,
                    bt.return_condition,
                    m.id as member_id,
                    m.name as member_name,
                    m.email as member_email,
                    b.id as book_id,
                    b.title as book_title,
                    b.author as book_author,
                    b.isbn,
                    CASE 
                        WHEN bt.return_date IS NULL AND bt.due_date < NOW() THEN 'OVERDUE'
                        WHEN bt.return_date IS NULL THEN 'ACTIVE'
                        ELSE 'RETURNED'
                    END as status,
                    DATEDIFF(NOW(), bt.due_date) as days_overdue
                FROM borrow_transactions bt
                INNER JOIN members m ON bt.member_id = m.id
                INNER JOIN books b ON bt.book_id = b.id
            `;

            // Apply filters
            if (filters.search) {
                whereConditions.push(`(m.name LIKE ? OR b.title LIKE ? OR b.author LIKE ? OR b.isbn LIKE ?)`);
                const searchPattern = `%${filters.search}%`;
                queryParams.push(searchPattern, searchPattern, searchPattern, searchPattern);
            }

            if (filters.status !== 'all') {
                switch (filters.status) {
                    case 'active':
                        whereConditions.push('bt.return_date IS NULL AND bt.due_date >= NOW()');
                        break;
                    case 'overdue':
                        whereConditions.push('bt.return_date IS NULL AND bt.due_date < NOW()');
                        break;
                    case 'returned':
                        whereConditions.push('bt.return_date IS NOT NULL');
                        break;
                }
            }

            if (filters.dateFrom) {
                whereConditions.push('DATE(bt.borrow_date) >= ?');
                queryParams.push(filters.dateFrom);
            }

            if (filters.dateTo) {
                whereConditions.push('DATE(bt.borrow_date) <= ?');
                queryParams.push(filters.dateTo);
            }

            if (filters.memberId) {
                whereConditions.push('bt.member_id = ?');
                queryParams.push(filters.memberId);
            }

            if (filters.bookId) {
                whereConditions.push('bt.book_id = ?');
                queryParams.push(filters.bookId);
            }

            // Build WHERE clause
            if (whereConditions.length > 0) {
                baseQuery += ' WHERE ' + whereConditions.join(' AND ');
            }

            // Add ORDER BY
            const validSortFields = ['borrow_date', 'due_date', 'return_date', 'member_name', 'book_title', 'status'];
            const sortBy = validSortFields.includes(filters.sortBy) ? filters.sortBy : 'borrow_date';
            const sortOrder = filters.sortOrder === 'asc' ? 'ASC' : 'DESC';
            baseQuery += ` ORDER BY ${sortBy} ${sortOrder}`;

            // Add pagination
            const offset = (filters.page - 1) * filters.limit;
            baseQuery += ` LIMIT ? OFFSET ?`;
            queryParams.push(filters.limit, offset);

            // Execute main query
            db.query(baseQuery, queryParams, (error, transactions) => {
                if (error) return reject(error);

                // Get total count for pagination
                let countQuery = `
                    SELECT COUNT(*) as total
                    FROM borrow_transactions bt
                    INNER JOIN members m ON bt.member_id = m.id
                    INNER JOIN books b ON bt.book_id = b.id
                `;

                if (whereConditions.length > 0) {
                    countQuery += ' WHERE ' + whereConditions.join(' AND ');
                }

                // Remove LIMIT and OFFSET params for count query
                const countParams = queryParams.slice(0, -2);

                db.query(countQuery, countParams, (countError, countResults) => {
                    if (countError) return reject(countError);

                    const total = countResults[0].total;
                    const totalPages = Math.ceil(total / filters.limit);

                    resolve({
                        transactions,
                        pagination: {
                            currentPage: filters.page,
                            totalPages,
                            totalRecords: total,
                            hasNext: filters.page < totalPages,
                            hasPrev: filters.page > 1
                        }
                    });
                });
            });
        });
    },

    // Get member's active borrow count for validation
    getMemberActiveBorrowCount: (memberId) => {
        return new Promise((resolve, reject) => {
            const query = `SELECT COUNT(*) as count FROM borrow_transactions WHERE member_id = ? AND return_date IS NULL`;
            db.query(query, [memberId], (error, results) => {
                if (error) return reject(error);
                resolve(results[0].count);
            });
        });
    },

    // Get active transactions for return form
    getActiveTransactions: () => {
        return new Promise((resolve, reject) => {
            const query = `
                SELECT 
                    bt.id,
                    bt.borrow_date,
                    bt.due_date,
                    m.name as member_name,
                    b.title as book_title,
                    b.author as book_author,
                    CASE 
                        WHEN bt.due_date < NOW() THEN 'OVERDUE'
                        ELSE 'ACTIVE'
                    END as status,
                    DATEDIFF(NOW(), bt.due_date) as days_overdue
                FROM borrow_transactions bt
                INNER JOIN members m ON bt.member_id = m.id
                INNER JOIN books b ON bt.book_id = b.id
                WHERE bt.return_date IS NULL
                ORDER BY bt.due_date ASC
            `;
            db.query(query, (error, results) => {
                if (error) return reject(error);
                resolve(results);
            });
        });
    },

    // Get single transaction by ID
    getTransactionById: (transactionId) => {
        return new Promise((resolve, reject) => {
            const query = `
                SELECT bt.*, m.name as member_name, b.title as book_title
                FROM borrow_transactions bt
                INNER JOIN members m ON bt.member_id = m.id
                INNER JOIN books b ON bt.book_id = b.id
                WHERE bt.id = ?
            `;
            db.query(query, [transactionId], (error, results) => {
                if (error) return reject(error);
                resolve(results[0]);
            });
        });
    },

    // Get transaction with full details
    getTransactionWithDetails: (transactionId) => {
        return new Promise((resolve, reject) => {
            const query = `
                SELECT 
                    bt.*,
                    m.name as member_name,
                    m.email as member_email,
                    m.phone as member_phone,
                    m.address as member_address,
                    b.title as book_title,
                    b.author as book_author,
                    b.isbn,
                    b.genre,
                    b.price,
                    CASE 
                        WHEN bt.return_date IS NULL AND bt.due_date < NOW() THEN 'OVERDUE'
                        WHEN bt.return_date IS NULL THEN 'ACTIVE'
                        ELSE 'RETURNED'
                    END as status,
                    DATEDIFF(NOW(), bt.due_date) as days_overdue
                FROM borrow_transactions bt
                INNER JOIN members m ON bt.member_id = m.id
                INNER JOIN books b ON bt.book_id = b.id
                WHERE bt.id = ?
            `;
            db.query(query, [transactionId], (error, results) => {
                if (error) return reject(error);
                resolve(results[0]);
            });
        });
    },

    // Transaction logging system
    logTransaction: (transactionId, action, description) => {
        return new Promise((resolve, reject) => {
            const query = `
                INSERT INTO transaction_logs (transaction_id, action, description, log_date)
                VALUES (?, ?, ?, NOW())
            `;
            db.query(query, [transactionId, action, description], (error, results) => {
                if (error) return reject(error);
                resolve(results.insertId);
            });
        });
    },

    // Get transaction history
    getTransactionHistory: (transactionId) => {
        return new Promise((resolve, reject) => {
            const query = `
                SELECT * FROM transaction_logs 
                WHERE transaction_id = ? 
                ORDER BY log_date DESC
            `;
            db.query(query, [transactionId], (error, results) => {
                if (error) return reject(error);
                resolve(results);
            });
        });
    },

    // Bulk operations
    bulkExtendDueDate: (transactionIds, newDueDate) => {
        return new Promise((resolve, reject) => {
            const placeholders = transactionIds.map(() => '?').join(',');
            const query = `UPDATE borrow_transactions SET due_date = ? WHERE id IN (${placeholders}) AND return_date IS NULL`;
            db.query(query, [newDueDate, ...transactionIds], (error, results) => {
                if (error) return reject(error);
                resolve(results);
            });
        });
    },

    bulkAddNotes: (transactionIds, notes) => {
        return new Promise((resolve, reject) => {
            const placeholders = transactionIds.map(() => '?').join(',');
            const query = `UPDATE borrow_transactions SET notes = CONCAT(COALESCE(notes, ''), '\n', ?) WHERE id IN (${placeholders})`;
            db.query(query, [notes, ...transactionIds], (error, results) => {
                if (error) return reject(error);
                resolve(results);
            });
        });
    },

    bulkWaiveFines: (transactionIds) => {
        return new Promise((resolve, reject) => {
            const placeholders = transactionIds.map(() => '?').join(',');
            const query = `UPDATE borrow_transactions SET fine_amount = 0 WHERE id IN (${placeholders})`;
            db.query(query, transactionIds, (error, results) => {
                if (error) return reject(error);
                resolve(results);
            });
        });
    },

    // Analytics methods
    getOverviewAnalytics: (days) => {
        return new Promise((resolve, reject) => {
            const query = `
                SELECT 
                    DATE(borrow_date) as date,
                    COUNT(*) as transactions,
                    COUNT(CASE WHEN return_date IS NOT NULL THEN 1 END) as returns,
                    SUM(fine_amount) as fines_collected
                FROM borrow_transactions 
                WHERE borrow_date >= DATE_SUB(NOW(), INTERVAL ? DAY)
                GROUP BY DATE(borrow_date)
                ORDER BY date DESC
            `;
            db.query(query, [days], (error, results) => {
                if (error) return reject(error);
                resolve(results);
            });
        });
    },

    // Export to CSV
    exportToCSV: (transactions) => {
        return new Promise((resolve) => {
            const headers = ['ID', 'Member', 'Book', 'Issue Date', 'Due Date', 'Return Date', 'Status', 'Fine Amount'];
            let csv = headers.join(',') + '\n';
            
            transactions.forEach(t => {
                const row = [
                    t.id,
                    `"${t.member_name}"`,
                    `"${t.book_title}"`,
                    t.borrow_date?.toISOString().split('T')[0] || '',
                    t.due_date?.toISOString().split('T')[0] || '',
                    t.return_date?.toISOString().split('T')[0] || '',
                    t.status,
                    t.fine_amount || 0
                ];
                csv += row.join(',') + '\n';
            });
            
            resolve(csv);
        });
    },

    // ...existing methods like getBorrowingStatistics, getPopularBooks, etc.
    getBorrowingStatistics: () => {
        return new Promise((resolve, reject) => {
            const query = `
                SELECT 
                    COUNT(*) as total_transactions,
                    COUNT(CASE WHEN return_date IS NULL THEN 1 END) as currently_borrowed,
                    COUNT(CASE WHEN return_date IS NOT NULL THEN 1 END) as returned_books,
                    COUNT(CASE WHEN return_date IS NULL AND due_date < NOW() THEN 1 END) as overdue_books,
                    AVG(DATEDIFF(COALESCE(return_date, NOW()), borrow_date)) as avg_borrow_duration,
                    MAX(borrow_date) as last_borrow_date,
                    MIN(borrow_date) as first_borrow_date
                FROM borrow_transactions
            `;
            db.query(query, (error, results) => {
                if (error) return reject(error);
                resolve(results[0]);
            });
        });
    },

    getPopularBooks: (limit = 10) => {
        return new Promise((resolve, reject) => {
            const query = `
                SELECT 
                    b.id,
                    b.title,
                    b.author,
                    b.genre,
                    COUNT(bt.id) as borrow_count,
                    COUNT(CASE WHEN bt.return_date IS NULL THEN 1 END) as currently_borrowed,
                    AVG(DATEDIFF(COALESCE(bt.return_date, NOW()), bt.borrow_date)) as avg_borrow_days,
                    MAX(bt.borrow_date) as last_borrowed
                FROM books b
                LEFT JOIN borrow_transactions bt ON b.id = bt.book_id
                GROUP BY b.id, b.title, b.author, b.genre
                HAVING borrow_count > 0
                ORDER BY borrow_count DESC, last_borrowed DESC
                LIMIT ?
            `;
            db.query(query, [limit], (error, results) => {
                if (error) return reject(error);
                resolve(results);
            });
        });
    },

    getAllBorrowedBooks: () => {
        return new Promise((resolve, reject) => {
            const query = `
                SELECT 
                    bt.id,
                    bt.borrow_date,
                    bt.due_date,
                    bt.return_date,
                    m.name as member_name,
                    m.email as member_email,
                    b.title as book_title,
                    b.author as book_author,
                    CASE 
                        WHEN bt.return_date IS NULL AND bt.due_date < NOW() THEN 'Overdue'
                        WHEN bt.return_date IS NULL THEN 'Borrowed'
                        ELSE 'Returned'
                    END as status,
                    CASE 
                        WHEN bt.return_date IS NULL AND bt.due_date < NOW() 
                        THEN DATEDIFF(NOW(), bt.due_date)
                        ELSE 0
                    END as days_overdue
                FROM borrow_transactions bt
                INNER JOIN members m ON bt.member_id = m.id
                INNER JOIN books b ON bt.book_id = b.id
                ORDER BY bt.borrow_date DESC
            `;
            db.query(query, (error, results) => {
                if (error) return reject(error);
                resolve(results);
            });
        });
    },

    getCurrentlyBorrowedBooks: () => {
        return new Promise((resolve, reject) => {
            const query = `
                SELECT 
                    b.id,
                    b.title,
                    b.author,
                    COUNT(bt.id) as times_borrowed,
                    MIN(bt.borrow_date) as first_borrowed,
                    MAX(bt.borrow_date) as last_borrowed,
                    m.name as current_borrower,
                    bt.due_date,
                    DATEDIFF(bt.due_date, NOW()) as days_until_due
                FROM books b
                INNER JOIN borrow_transactions bt ON b.id = bt.book_id
                INNER JOIN members m ON bt.member_id = m.id
                WHERE bt.return_date IS NULL
                GROUP BY b.id, b.title, b.author, m.name, bt.due_date
                ORDER BY days_until_due ASC
            `;
            db.query(query, (error, results) => {
                if (error) return reject(error);
                resolve(results);
            });
        });
    }
};

module.exports = Borrow;