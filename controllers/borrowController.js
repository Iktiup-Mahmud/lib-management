const Borrow = require('../models/borrowModel');

// Show issue book form
exports.showIssueForm = (req, res) => {
    res.render('borrow/issue', { 
        title: 'Issue Book'
    });
};

// Issue a book to a member
exports.issueBook = async (req, res) => {
    try {
        const transactionId = await Borrow.issueBook({
            member_id: req.body.memberId,
            book_id: req.body.bookId
        });
        res.redirect('/borrow?success=Book issued successfully');
    } catch (error) {
        console.error('Error issuing book:', error);
        res.render('borrow/issue', { 
            error: 'Error issuing book: ' + error.message,
            title: 'Issue Book',
            formData: req.body
        });
    }
};

// Show return book form
exports.showReturnForm = (req, res) => {
    res.render('borrow/return', { 
        title: 'Return Book'
    });
};

// Return a borrowed book
exports.returnBook = async (req, res) => {
    try {
        const affectedRows = await Borrow.returnBook(req.body.transactionId || req.params.id);
        if (affectedRows === 0) {
            return res.render('borrow/return', { 
                error: 'Transaction not found or book already returned',
                title: 'Return Book'
            });
        }
        res.redirect('/borrow?success=Book returned successfully');
    } catch (error) {
        console.error('Error returning book:', error);
        res.render('borrow/return', { 
            error: 'Error returning book: ' + error.message,
            title: 'Return Book',
            formData: req.body
        });
    }
};

// List all borrowing transactions
exports.listBorrowedBooks = async (req, res) => {
    try {
        const transactions = await Borrow.getAllBorrowedBooks();
        res.render('borrow/list', { 
            transactions,
            title: 'Borrowing Transactions'
        });
    } catch (error) {
        console.error('Error retrieving borrowed books:', error);
        res.status(500).render('error', { 
            message: 'Error retrieving borrowed books', 
            error 
        });
    }
};

// Get currently borrowed books
exports.getCurrentlyBorrowedBooks = async (req, res) => {
    try {
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
};

// Get borrowing statistics
exports.getBorrowingStatistics = async (req, res) => {
    try {
        const stats = await Borrow.getBorrowingStatistics();
        res.json(stats);
    } catch (error) {
        console.error('Error retrieving borrowing statistics:', error);
        res.status(500).json({ 
            message: 'Error retrieving borrowing statistics', 
            error: error.message 
        });
    }
};

// Get popular books report
exports.getPopularBooks = async (req, res) => {
    try {
        const limit = req.query.limit || 10;
        const popularBooks = await Borrow.getPopularBooks(parseInt(limit));
        res.render('reports/popular-books', {
            popularBooks,
            title: 'Popular Books Report',
            reportDate: new Date()
        });
    } catch (error) {
        console.error('Error retrieving popular books:', error);
        res.status(500).render('error', { 
            message: 'Error retrieving popular books', 
            error 
        });
    }
};