const express = require('express');
const router = express.Router();
const bookController = require('../controllers/bookController');

// Route to get all books
router.get('/', bookController.getAllBooks);

// Route to show add book form
router.get('/add', bookController.showAddForm);

// Route to show edit book form  
router.get('/edit/:id', bookController.showEditForm);

// Route to get available books
router.get('/available', bookController.getAvailableBooks);

// Route to search books
router.get('/search', bookController.searchBooks);

// Route to get a specific book by ID
router.get('/:id', bookController.getBookById);

// Route to add a new book
router.post('/', bookController.addBook);

// Route to update an existing book
router.post('/update/:id', bookController.updateBook);

// Route to delete a book
router.get('/delete/:id', bookController.deleteBook);

// API route to get available books (for search functionality in borrow form)
router.get('/api/books/available', async (req, res) => {
    try {
        const Book = require('../models/bookModel');
        const books = await Book.getAvailableBooks();
        res.json(books);
    } catch (error) {
        console.error('Error retrieving available books for API:', error);
        res.status(500).json({ 
            message: 'Error retrieving available books', 
            error: error.message 
        });
    }
});

module.exports = router;