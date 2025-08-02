const Borrow = require('../models/borrowModel');
const Book = require('../models/bookModel');
const Member = require('../models/memberModel');

// Enhanced transaction dashboard with analytics
exports.showTransactionDashboard = async (req, res) => {
    try {
        // Get comprehensive transaction statistics
        const stats = await Borrow.getTransactionStatistics();
        const recentTransactions = await Borrow.getRecentTransactions(10);
        const overdueTransactions = await Borrow.getOverdueTransactions();
        const monthlyTrends = await Borrow.getMonthlyTrends();
        const topMembers = await Borrow.getTopBorrowers(5);
        const topBooks = await Borrow.getPopularBooks(5);

        res.render('borrow/dashboard', {
            stats,
            recentTransactions,
            overdueTransactions,
            monthlyTrends,
            topMembers,
            topBooks,
            title: 'Transaction Dashboard'
        });
    } catch (error) {
        console.error('Error loading transaction dashboard:', error);
        res.status(500).render('error', { 
            message: 'Error loading transaction dashboard', 
            error 
        });
    }
};

// Advanced transaction list with filtering and search
exports.listBorrowedBooks = async (req, res) => {
    try {
        const {
            search = '',
            status = 'all',
            dateFrom = '',
            dateTo = '',
            memberId = '',
            bookId = '',
            sortBy = 'borrow_date',
            sortOrder = 'desc',
            page = 1,
            limit = 20
        } = req.query;

        const filters = {
            search,
            status,
            dateFrom,
            dateTo,
            memberId,
            bookId,
            sortBy,
            sortOrder,
            page: parseInt(page),
            limit: parseInt(limit)
        };

        const result = await Borrow.getTransactionsWithFilters(filters);
        const members = await Member.getAll();
        const books = await Book.getAll();

        res.render('borrow/list', { 
            transactions: result.transactions,
            pagination: result.pagination,
            filters,
            members,
            books,
            title: 'Transaction Management'
        });
    } catch (error) {
        console.error('Error retrieving transactions:', error);
        res.status(500).render('error', { 
            message: 'Error retrieving transactions', 
            error 
        });
    }
};

// Enhanced issue book with validation and availability check
exports.showIssueForm = async (req, res) => {
    try {
        const { bookId, memberId } = req.query;
        const members = await Member.getAll();
        const availableBooks = await Book.getAvailable();
        
        // Pre-populate form data if bookId or memberId is provided
        let formData = req.query;
        let preselectedBook = null;
        let preselectedMember = null;
        
        if (bookId) {
            preselectedBook = await Book.getById(bookId);
            if (preselectedBook) {
                formData.bookTitle = preselectedBook.title;
                formData.bookId = preselectedBook.id;
            }
        }
        
        if (memberId) {
            preselectedMember = await Member.getById(memberId);
            if (preselectedMember) {
                formData.memberName = preselectedMember.name;
                formData.memberId = preselectedMember.id;
            }
        }
        
        res.render('borrow/issue', { 
            title: 'Issue Book',
            members,
            availableBooks,
            formData,
            preselectedBook,
            preselectedMember
        });
    } catch (error) {
        console.error('Error loading issue form:', error);
        res.status(500).render('error', { 
            message: 'Error loading issue form', 
            error 
        });
    }
};

// Enhanced book issuing with advanced validation
exports.issueBook = async (req, res) => {
    try {
        const { memberId, bookId, dueDate, notes } = req.body;

        // Validate member borrowing limit
        const memberBorrowCount = await Borrow.getMemberActiveBorrowCount(memberId);
        const member = await Member.getById(memberId);
        
        if (memberBorrowCount >= (member.max_books_allowed || 3)) {
            throw new Error('Member has reached maximum borrowing limit');
        }

        // Check book availability
        const book = await Book.getById(bookId);
        if (book.available_copies <= 0) {
            throw new Error('Book is not available for borrowing');
        }

        const transactionData = {
            member_id: memberId,
            book_id: bookId,
            due_date: dueDate || null,
            notes: notes || ''
        };

        const transactionId = await Borrow.issueBook(transactionData);
        
        // Log the transaction
        await Borrow.logTransaction(transactionId, 'ISSUED', `Book issued to ${member.name}`);

        res.redirect(`/borrow/transaction/${transactionId}?success=Book issued successfully`);
    } catch (error) {
        console.error('Error issuing book:', error);
        const members = await Member.getAll();
        const availableBooks = await Book.getAvailable();
        
        res.render('borrow/issue', { 
            error: 'Error issuing book: ' + error.message,
            title: 'Issue Book',
            members,
            availableBooks,
            formData: req.body
        });
    }
};

// Enhanced return book with fine calculation
exports.showReturnForm = async (req, res) => {
    try {
        const activeTransactions = await Borrow.getActiveTransactions();
        
        res.render('borrow/return', { 
            title: 'Return Book',
            activeTransactions
        });
    } catch (error) {
        console.error('Error loading return form:', error);
        res.status(500).render('error', { 
            message: 'Error loading return form', 
            error 
        });
    }
};

// Enhanced book return with fine processing
exports.returnBook = async (req, res) => {
    try {
        const { transactionId, condition, notes, fineWaived } = req.body;
        
        const transaction = await Borrow.getTransactionById(transactionId);
        if (!transaction) {
            throw new Error('Transaction not found');
        }

        if (transaction.return_date) {
            throw new Error('Book already returned');
        }

        // Calculate fine if overdue
        let fineAmount = 0;
        if (new Date() > new Date(transaction.due_date)) {
            const daysOverdue = Math.ceil((new Date() - new Date(transaction.due_date)) / (1000 * 60 * 60 * 24));
            fineAmount = daysOverdue * 1.00; // $1 per day overdue
        }

        if (fineWaived === 'true') {
            fineAmount = 0;
        }

        const returnData = {
            transaction_id: transactionId,
            fine_amount: fineAmount,
            condition: condition || 'GOOD',
            notes: notes || ''
        };

        await Borrow.returnBook(returnData);
        
        // Log the transaction
        await Borrow.logTransaction(transactionId, 'RETURNED', 
            `Book returned. Condition: ${condition}. Fine: $${fineAmount}`);

        res.redirect(`/borrow/transaction/${transactionId}?success=Book returned successfully`);
    } catch (error) {
        console.error('Error returning book:', error);
        const activeTransactions = await Borrow.getActiveTransactions();
        
        res.render('borrow/return', { 
            error: 'Error returning book: ' + error.message,
            title: 'Return Book',
            activeTransactions,
            formData: req.body
        });
    }
};

// Individual transaction details view
exports.getTransactionDetails = async (req, res) => {
    try {
        const transactionId = req.params.id;
        const transaction = await Borrow.getTransactionWithDetails(transactionId);
        const transactionHistory = await Borrow.getTransactionHistory(transactionId);

        if (!transaction) {
            return res.status(404).render('error', { 
                message: 'Transaction not found' 
            });
        }

        res.render('borrow/details', {
            transaction,
            transactionHistory,
            title: `Transaction #${transactionId}`
        });
    } catch (error) {
        console.error('Error retrieving transaction details:', error);
        res.status(500).render('error', { 
            message: 'Error retrieving transaction details', 
            error 
        });
    }
};

// Bulk operations for transactions
exports.processBulkOperations = async (req, res) => {
    try {
        const { action, transactionIds, data } = req.body;
        let result;

        switch (action) {
            case 'extend_due_date':
                result = await Borrow.bulkExtendDueDate(transactionIds, data.newDueDate);
                break;
            case 'add_notes':
                result = await Borrow.bulkAddNotes(transactionIds, data.notes);
                break;
            case 'send_reminders':
                result = await Borrow.bulkSendReminders(transactionIds);
                break;
            case 'waive_fines':
                result = await Borrow.bulkWaiveFines(transactionIds);
                break;
            default:
                throw new Error('Invalid bulk operation');
        }

        res.json({ 
            success: true, 
            message: `Bulk operation completed. ${result.affectedRows} transactions updated.`,
            affectedRows: result.affectedRows 
        });
    } catch (error) {
        console.error('Error processing bulk operation:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error processing bulk operation: ' + error.message 
        });
    }
};

// Transaction analytics and reports
exports.getTransactionAnalytics = async (req, res) => {
    try {
        const { period = '30', type = 'overview' } = req.query;
        
        let analytics;
        switch (type) {
            case 'overview':
                analytics = await Borrow.getOverviewAnalytics(period);
                break;
            case 'member_analysis':
                analytics = await Borrow.getMemberAnalytics(period);
                break;
            case 'book_analysis':
                analytics = await Borrow.getBookAnalytics(period);
                break;
            case 'fine_analysis':
                analytics = await Borrow.getFineAnalytics(period);
                break;
            default:
                analytics = await Borrow.getOverviewAnalytics(period);
        }

        res.render('borrow/analytics', {
            analytics,
            period,
            type,
            title: 'Transaction Analytics'
        });
    } catch (error) {
        console.error('Error retrieving analytics:', error);
        res.status(500).render('error', { 
            message: 'Error retrieving analytics', 
            error 
        });
    }
};

// Export transactions to various formats
exports.exportTransactions = async (req, res) => {
    try {
        const { format = 'csv', filters = {} } = req.query;
        
        const transactions = await Borrow.getTransactionsForExport(filters);
        
        switch (format.toLowerCase()) {
            case 'csv':
                res.setHeader('Content-Type', 'text/csv');
                res.setHeader('Content-Disposition', 'attachment; filename=transactions.csv');
                res.send(await Borrow.exportToCSV(transactions));
                break;
            case 'excel':
                res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
                res.setHeader('Content-Disposition', 'attachment; filename=transactions.xlsx');
                res.send(await Borrow.exportToExcel(transactions));
                break;
            case 'pdf':
                res.setHeader('Content-Type', 'application/pdf');
                res.setHeader('Content-Disposition', 'attachment; filename=transactions.pdf');
                res.send(await Borrow.exportToPDF(transactions));
                break;
            default:
                throw new Error('Unsupported export format');
        }
    } catch (error) {
        console.error('Error exporting transactions:', error);
        res.status(500).json({ 
            message: 'Error exporting transactions', 
            error: error.message 
        });
    }
};