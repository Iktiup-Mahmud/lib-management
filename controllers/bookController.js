const Book = require('../models/bookModel');

// Get all books with enhanced data
exports.getAllBooks = async (req, res) => {
    try {
        const books = await Book.getAll();
        res.render('books/list', { 
            books,
            title: 'Books List'
        });
    } catch (error) {
        console.error('Error retrieving books:', error);
        res.status(500).render('error', { 
            message: 'Error retrieving books', 
            error 
        });
    }
};

// Get a single book by ID
exports.getBookById = async (req, res) => {
    try {
        const book = await Book.getById(req.params.id);
        if (!book) {
            return res.status(404).render('error', { 
                message: 'Book not found' 
            });
        }
        res.render('books/detail', { 
            book,
            title: `Book: ${book.title}`
        });
    } catch (error) {
        console.error('Error retrieving book:', error);
        res.status(500).render('error', { 
            message: 'Error retrieving book', 
            error 
        });
    }
};

// Show add book form
exports.showAddForm = (req, res) => {
    res.render('books/add', { 
        title: 'Add New Book' 
    });
};

// Add a new book
exports.addBook = async (req, res) => {
    try {
        const bookId = await Book.create(req.body);
        res.redirect('/books?success=Book added successfully');
    } catch (error) {
        console.error('Error adding book:', error);
        res.render('books/add', { 
            error: 'Error adding book: ' + error.message,
            title: 'Add New Book',
            formData: req.body
        });
    }
};

// Show edit book form
exports.showEditForm = async (req, res) => {
    try {
        const book = await Book.getById(req.params.id);
        if (!book) {
            return res.status(404).render('error', { 
                message: 'Book not found' 
            });
        }
        res.render('books/edit', { 
            book,
            title: `Edit Book: ${book.title}`
        });
    } catch (error) {
        console.error('Error retrieving book for edit:', error);
        res.status(500).render('error', { 
            message: 'Error retrieving book', 
            error 
        });
    }
};

// Update an existing book
exports.updateBook = async (req, res) => {
    try {
        const affectedRows = await Book.update(req.params.id, req.body);
        if (affectedRows === 0) {
            return res.status(404).render('error', { 
                message: 'Book not found' 
            });
        }
        res.redirect('/books?success=Book updated successfully');
    } catch (error) {
        console.error('Error updating book:', error);
        const book = await Book.getById(req.params.id).catch(() => null);
        res.render('books/edit', { 
            book: book || req.body,
            error: 'Error updating book: ' + error.message,
            title: 'Edit Book'
        });
    }
};

// Delete a book
exports.deleteBook = async (req, res) => {
    try {
        const affectedRows = await Book.delete(req.params.id);
        if (affectedRows === 0) {
            return res.status(404).json({ message: 'Book not found' });
        }
        res.redirect('/books?success=Book deleted successfully');
    } catch (error) {
        console.error('Error deleting book:', error);
        res.redirect('/books?error=Error deleting book: ' + error.message);
    }
};

// Get available books
exports.getAvailableBooks = async (req, res) => {
    try {
        const books = await Book.getAvailable();
        res.render('books/available', {
            books,
            title: 'Available Books'
        });
    } catch (error) {
        console.error('Error retrieving available books:', error);
        res.status(500).render('error', { 
            message: 'Error retrieving available books', 
            error 
        });
    }
};

// Search books
exports.searchBooks = async (req, res) => {
    try {
        const searchTerm = req.query.q || '';
        const books = searchTerm ? await Book.search(searchTerm) : await Book.getAll();
        res.render('books/list', {
            books,
            searchTerm,
            title: searchTerm ? `Search Results for "${searchTerm}"` : 'All Books'
        });
    } catch (error) {
        console.error('Error searching books:', error);
        res.status(500).render('error', { 
            message: 'Error searching books', 
            error 
        });
    }
};