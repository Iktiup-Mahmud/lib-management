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