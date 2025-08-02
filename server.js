const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const path = require('path');
const db = require('./config/db');
const bookRoutes = require('./routes/bookRoutes');
const memberRoutes = require('./routes/memberRoutes');
const borrowRoutes = require('./routes/borrowRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const databaseRoutes = require('./routes/databaseRoutes');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
}));

// View engine setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// API routes for AJAX requests
app.get('/api/members', async (req, res) => {
    try {
        const Member = require('./models/memberModel');
        const members = await Member.getAll();
        res.json(members);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/books/available', async (req, res) => {
    try {
        const Book = require('./models/bookModel');
        const books = await Book.getAvailable();
        res.json(books);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Routes
app.use('/books', bookRoutes);
app.use('/members', memberRoutes);
app.use('/borrow', borrowRoutes);
app.use('/dashboard', dashboardRoutes);
app.use('/', databaseRoutes);

// Home route
app.get('/', (req, res) => {
    res.redirect('/dashboard');
});

// Start server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});