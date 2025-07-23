const db = require('../config/db');

const Book = {
    create: (bookData) => {
        return new Promise((resolve, reject) => {
            const query = `INSERT INTO books (title, author, genre, published_date, isbn, available_copies, total_copies, price) 
                          VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
            const values = [
                bookData.title, 
                bookData.author, 
                bookData.genre || 'Fiction',
                bookData.publishedDate || bookData.published_date,
                bookData.isbn,
                bookData.available_copies || 1,
                bookData.total_copies || 1,
                bookData.price || 0.00
            ];
            
            db.query(query, values, (error, results) => {
                if (error) return reject(error);
                resolve(results.insertId);
            });
        });
    },

    getAll: () => {
        return new Promise((resolve, reject) => {
            const query = `
                SELECT 
                    b.*,
                    COUNT(bt.id) as total_borrowed,
                    COUNT(CASE WHEN bt.return_date IS NULL THEN 1 END) as currently_borrowed
                FROM books b
                LEFT JOIN borrow_transactions bt ON b.id = bt.book_id
                GROUP BY b.id
                ORDER BY b.title
            `;
            db.query(query, (error, results) => {
                if (error) return reject(error);
                resolve(results);
            });
        });
    },

    getById: (id) => {
        return new Promise((resolve, reject) => {
            const query = `
                SELECT 
                    b.*,
                    COUNT(bt.id) as total_borrowed,
                    COUNT(CASE WHEN bt.return_date IS NULL THEN 1 END) as currently_borrowed
                FROM books b
                LEFT JOIN borrow_transactions bt ON b.id = bt.book_id
                WHERE b.id = ?
                GROUP BY b.id
            `;
            db.query(query, [id], (error, results) => {
                if (error) return reject(error);
                resolve(results[0]);
            });
        });
    },

    update: (id, bookData) => {
        return new Promise((resolve, reject) => {
            const query = `UPDATE books 
                          SET title = ?, author = ?, genre = ?, published_date = ?, 
                              isbn = ?, available_copies = ?, total_copies = ?, price = ?
                          WHERE id = ?`;
            const values = [
                bookData.title,
                bookData.author,
                bookData.genre || 'Fiction',
                bookData.publishedDate || bookData.published_date,
                bookData.isbn,
                bookData.available_copies || 1,
                bookData.total_copies || 1,
                bookData.price || 0.00,
                id
            ];
            
            db.query(query, values, (error, results) => {
                if (error) return reject(error);
                resolve(results.affectedRows);
            });
        });
    },

    delete: (id) => {
        return new Promise((resolve, reject) => {
            const query = 'DELETE FROM books WHERE id = ?';
            db.query(query, [id], (error, results) => {
                if (error) return reject(error);
                resolve(results.affectedRows);
            });
        });
    },

    // Get available books using view
    getAvailable: () => {
        return new Promise((resolve, reject) => {
            const query = 'SELECT * FROM vw_available_books ORDER BY title';
            db.query(query, (error, results) => {
                if (error) return reject(error);
                resolve(results);
            });
        });
    },

    // Search books by title, author, or genre
    search: (searchTerm) => {
        return new Promise((resolve, reject) => {
            const query = `
                SELECT * FROM books 
                WHERE title LIKE ? OR author LIKE ? OR genre LIKE ?
                ORDER BY title
            `;
            const searchPattern = `%${searchTerm}%`;
            db.query(query, [searchPattern, searchPattern, searchPattern], (error, results) => {
                if (error) return reject(error);
                resolve(results);
            });
        });
    }
};

module.exports = Book;