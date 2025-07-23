const db = require('../config/db');

const Borrow = {
    // Issue a book to a member
    issueBook: (memberData) => {
        return new Promise((resolve, reject) => {
            const query = `INSERT INTO borrow_transactions (member_id, book_id, borrow_date, due_date) 
                          VALUES (?, ?, NOW(), DATE_ADD(NOW(), INTERVAL 14 DAY))`;
            db.query(query, [memberData.member_id, memberData.book_id], (error, results) => {
                if (error) return reject(error);
                // Update book available copies
                const updateBookQuery = `UPDATE books SET available_copies = available_copies - 1 WHERE id = ? AND available_copies > 0`;
                db.query(updateBookQuery, [memberData.book_id], (updateError, updateResults) => {
                    if (updateError) return reject(updateError);
                    if (updateResults.affectedRows === 0) {
                        return reject(new Error('Book not available for borrowing'));
                    }
                    resolve(results.insertId);
                });
            });
        });
    },

    // Return a book
    returnBook: (transactionId) => {
        return new Promise((resolve, reject) => {
            // First get the book_id from the transaction
            const getBookQuery = `SELECT book_id FROM borrow_transactions WHERE id = ? AND return_date IS NULL`;
            db.query(getBookQuery, [transactionId], (error, results) => {
                if (error) return reject(error);
                if (results.length === 0) {
                    return reject(new Error('Transaction not found or book already returned'));
                }
                
                const bookId = results[0].book_id;
                
                // Update the transaction with return date
                const returnQuery = `UPDATE borrow_transactions SET return_date = NOW() WHERE id = ?`;
                db.query(returnQuery, [transactionId], (returnError, returnResults) => {
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

    // Get all borrow transactions with member and book details (JOIN)
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

    // Get currently borrowed books (COMPLEX QUERY with aggregation)
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
    },

    // Get borrowing statistics (AGGREGATION FUNCTIONS)
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

    // Get popular books (COMPLEX QUERY with JOIN and AGGREGATION)
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
    }
};

module.exports = Borrow;