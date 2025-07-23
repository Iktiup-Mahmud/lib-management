const db = require('../config/db');

const Member = {
    // Create a new member
    create: (memberData) => {
        return new Promise((resolve, reject) => {
            const query = `INSERT INTO members (name, email, phone, address, registration_date) 
                          VALUES (?, ?, ?, ?, NOW())`;
            db.query(query, [memberData.name, memberData.email, memberData.phone, memberData.address], (error, results) => {
                if (error) return reject(error);
                resolve(results.insertId);
            });
        });
    },

    // Get all members with borrowing statistics (JOIN + AGGREGATION)
    getAll: () => {
        return new Promise((resolve, reject) => {
            const query = `
                SELECT 
                    m.id,
                    m.name,
                    m.email,
                    m.phone,
                    m.address,
                    m.registration_date,
                    COUNT(bt.id) as total_borrowed,
                    COUNT(CASE WHEN bt.return_date IS NULL THEN 1 END) as currently_borrowed
                FROM members m
                LEFT JOIN borrow_transactions bt ON m.id = bt.member_id
                GROUP BY m.id, m.name, m.email, m.phone, m.address, m.registration_date
                ORDER BY m.name
            `;
            db.query(query, (error, results) => {
                if (error) return reject(error);
                resolve(results);
            });
        });
    },

    // Get member by ID with borrowing history (COMPLEX QUERY with JOIN)
    getById: (id) => {
        return new Promise((resolve, reject) => {
            const query = `
                SELECT 
                    m.*,
                    COUNT(bt.id) as total_borrowed,
                    COUNT(CASE WHEN bt.return_date IS NULL THEN 1 END) as currently_borrowed
                FROM members m
                LEFT JOIN borrow_transactions bt ON m.id = bt.member_id
                WHERE m.id = ?
                GROUP BY m.id
            `;
            db.query(query, [id], (error, results) => {
                if (error) return reject(error);
                resolve(results[0]);
            });
        });
    },

    // Update member
    update: (id, memberData) => {
        return new Promise((resolve, reject) => {
            const query = `UPDATE members 
                          SET name = ?, email = ?, phone = ?, address = ? 
                          WHERE id = ?`;
            db.query(query, [memberData.name, memberData.email, memberData.phone, memberData.address, id], (error, results) => {
                if (error) return reject(error);
                resolve(results.affectedRows);
            });
        });
    },

    // Delete member
    delete: (id) => {
        return new Promise((resolve, reject) => {
            const query = 'DELETE FROM members WHERE id = ?';
            db.query(query, [id], (error, results) => {
                if (error) return reject(error);
                resolve(results.affectedRows);
            });
        });
    },

    // Get members with overdue books (COMPLEX QUERY)
    getOverdueMembers: () => {
        return new Promise((resolve, reject) => {
            const query = `
                SELECT 
                    m.id,
                    m.name,
                    m.email,
                    COUNT(bt.id) as overdue_books,
                    MIN(bt.borrow_date) as earliest_borrow
                FROM members m
                INNER JOIN borrow_transactions bt ON m.id = bt.member_id
                WHERE bt.return_date IS NULL 
                AND DATEDIFF(NOW(), bt.borrow_date) > 14
                GROUP BY m.id, m.name, m.email
                HAVING overdue_books > 0
                ORDER BY overdue_books DESC
            `;
            db.query(query, (error, results) => {
                if (error) return reject(error);
                resolve(results);
            });
        });
    }
};

module.exports = Member;