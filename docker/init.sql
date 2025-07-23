-- Comprehensive SQL script for Library Management System
-- Drop existing tables to avoid conflicts
SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS fines;
DROP TABLE IF EXISTS book_categories;
DROP TABLE IF EXISTS categories;
DROP TABLE IF EXISTS borrow_transactions;
DROP TABLE IF EXISTS members;
DROP TABLE IF EXISTS books;
SET FOREIGN_KEY_CHECKS = 1;

-- Create tables with comprehensive constraints
CREATE TABLE books (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    author VARCHAR(255) NOT NULL,
    genre VARCHAR(100) NOT NULL DEFAULT 'Fiction',
    published_date DATE NOT NULL,
    isbn VARCHAR(20) UNIQUE,
    available_copies INT DEFAULT 1 CHECK (available_copies >= 0),
    total_copies INT DEFAULT 1 CHECK (total_copies > 0),
    price DECIMAL(10,2) DEFAULT 0.00 CHECK (price >= 0),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE members (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(15) NOT NULL,
    address TEXT NOT NULL DEFAULT 'Not specified',
    registration_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    membership_type ENUM('REGULAR', 'PREMIUM', 'STUDENT') DEFAULT 'REGULAR',
    is_active BOOLEAN DEFAULT TRUE,
    max_books_allowed INT DEFAULT 3 CHECK (max_books_allowed > 0),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE borrow_transactions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    book_id INT NOT NULL,
    member_id INT NOT NULL,
    borrow_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    due_date DATE NOT NULL DEFAULT (DATE_ADD(CURDATE(), INTERVAL 14 DAY)),
    return_date TIMESTAMP NULL,
    fine_amount DECIMAL(10,2) DEFAULT 0.00 CHECK (fine_amount >= 0),
    status ENUM('BORROWED', 'RETURNED', 'OVERDUE') DEFAULT 'BORROWED',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE ON UPDATE CASCADE
);

-- Categories table for better normalization
CREATE TABLE categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Junction table for book-category relationship
CREATE TABLE book_categories (
    book_id INT NOT NULL,
    category_id INT NOT NULL,
    PRIMARY KEY (book_id, category_id),
    FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
);

-- Fines table
CREATE TABLE fines (
    id INT AUTO_INCREMENT PRIMARY KEY,
    transaction_id INT NOT NULL,
    amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
    reason VARCHAR(255) NOT NULL DEFAULT 'Overdue book',
    paid BOOLEAN DEFAULT FALSE,
    paid_date TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (transaction_id) REFERENCES borrow_transactions(id) ON DELETE CASCADE
);

-- Insert sample data
INSERT INTO books (title, author, genre, published_date, isbn, available_copies, total_copies, price) VALUES
('The Great Gatsby', 'F. Scott Fitzgerald', 'Fiction', '1925-04-10', '9780743273565', 3, 5, 15.99),
('To Kill a Mockingbird', 'Harper Lee', 'Fiction', '1960-07-11', '9780061120084', 2, 3, 12.99),
('1984', 'George Orwell', 'Dystopian', '1949-06-08', '9780451524935', 1, 4, 13.99),
('Pride and Prejudice', 'Jane Austen', 'Romance', '1813-01-28', '9780141439518', 2, 2, 11.99),
('The Catcher in the Rye', 'J.D. Salinger', 'Fiction', '1951-07-16', '9780316769174', 1, 3, 14.99),
('Lord of the Flies', 'William Golding', 'Adventure', '1954-09-17', '9780571056866', 2, 2, 10.99),
('Animal Farm', 'George Orwell', 'Political Satire', '1945-08-17', '9780452284241', 3, 4, 9.99),
('The Hobbit', 'J.R.R. Tolkien', 'Fantasy', '1937-09-21', '9780547928227', 1, 2, 16.99);

INSERT INTO members (name, email, phone, address, membership_type) VALUES
('John Doe', 'john.doe@email.com', '123-456-7890', '123 Main St, City, State', 'REGULAR'),
('Jane Smith', 'jane.smith@email.com', '098-765-4321', '456 Oak Ave, City, State', 'PREMIUM'),
('Alice Johnson', 'alice.johnson@email.com', '555-123-4567', '789 Pine Rd, City, State', 'STUDENT'),
('Bob Brown', 'bob.brown@email.com', '444-987-6543', '321 Elm St, City, State', 'REGULAR'),
('Charlie Wilson', 'charlie.wilson@email.com', '777-888-9999', '654 Maple Dr, City, State', 'PREMIUM');

INSERT INTO categories (name, description) VALUES
('Fiction', 'Literary works of fiction'),
('Non-Fiction', 'Factual and informational books'),
('Science Fiction', 'Futuristic and scientific themes'),
('Romance', 'Love and relationship stories'),
('Mystery', 'Crime and detective stories'),
('Biography', 'Life stories of real people'),
('History', 'Historical events and periods'),
('Science', 'Scientific knowledge and discoveries');

-- Insert some borrow transactions
INSERT INTO borrow_transactions (member_id, book_id, borrow_date, due_date, status) VALUES
(1, 1, DATE_SUB(NOW(), INTERVAL 5 DAY), DATE_ADD(DATE_SUB(NOW(), INTERVAL 5 DAY), INTERVAL 14 DAY), 'BORROWED'),
(2, 3, DATE_SUB(NOW(), INTERVAL 10 DAY), DATE_ADD(DATE_SUB(NOW(), INTERVAL 10 DAY), INTERVAL 14 DAY), 'BORROWED'),
(3, 2, DATE_SUB(NOW(), INTERVAL 20 DAY), DATE_SUB(NOW(), INTERVAL 3 DAY), 'OVERDUE'),
(1, 4, DATE_SUB(NOW(), INTERVAL 25 DAY), DATE_SUB(NOW(), INTERVAL 15 DAY), 'RETURNED');

-- Update return date for returned books
UPDATE borrow_transactions SET return_date = DATE_SUB(NOW(), INTERVAL 2 DAY) WHERE id = 4;

-- Create comprehensive views
CREATE VIEW vw_available_books AS
SELECT 
    b.id,
    b.title,
    b.author,
    b.genre,
    b.published_date,
    b.isbn,
    b.available_copies,
    b.total_copies,
    b.price,
    COUNT(bt.id) as total_borrowed_times,
    COALESCE(AVG(DATEDIFF(bt.return_date, bt.borrow_date)), 0) as avg_borrow_duration,
    MAX(bt.borrow_date) as last_borrowed_date,
    CASE 
        WHEN b.available_copies > 0 THEN 'Available'
        ELSE 'Not Available'
    END as availability_status
FROM books b
LEFT JOIN borrow_transactions bt ON b.id = bt.book_id AND bt.return_date IS NOT NULL
WHERE b.available_copies > 0
GROUP BY b.id, b.title, b.author, b.genre, b.published_date, b.isbn, 
         b.available_copies, b.total_copies, b.price
ORDER BY b.title;

CREATE VIEW vw_member_statistics AS
SELECT 
    m.id,
    m.name,
    m.email,
    m.phone,
    m.address,
    m.registration_date,
    m.membership_type,
    m.is_active,
    COUNT(bt.id) as total_books_borrowed,
    COUNT(CASE WHEN bt.return_date IS NULL THEN 1 END) as currently_borrowed,
    COUNT(CASE WHEN bt.return_date IS NOT NULL THEN 1 END) as returned_books,
    COUNT(CASE WHEN bt.status = 'OVERDUE' THEN 1 END) as overdue_books,
    COALESCE(SUM(bt.fine_amount), 0) as total_fines,
    COALESCE(AVG(DATEDIFF(COALESCE(bt.return_date, NOW()), bt.borrow_date)), 0) as avg_borrow_duration,
    MAX(bt.borrow_date) as last_borrow_date,
    MIN(bt.borrow_date) as first_borrow_date,
    DATEDIFF(NOW(), m.registration_date) as days_since_registration
FROM members m
LEFT JOIN borrow_transactions bt ON m.id = bt.member_id
GROUP BY m.id, m.name, m.email, m.phone, m.address, m.registration_date, 
         m.membership_type, m.is_active
ORDER BY total_books_borrowed DESC;

CREATE VIEW vw_current_borrowings AS
SELECT 
    bt.id as transaction_id,
    m.name as member_name,
    m.email as member_email,
    m.phone as member_phone,
    b.title as book_title,
    b.author as book_author,
    b.isbn,
    bt.borrow_date,
    bt.due_date,
    DATEDIFF(bt.due_date, NOW()) as days_until_due,
    CASE 
        WHEN bt.due_date < NOW() THEN DATEDIFF(NOW(), bt.due_date)
        ELSE 0
    END as days_overdue,
    bt.fine_amount,
    CASE 
        WHEN bt.due_date < NOW() THEN 'Overdue'
        WHEN DATEDIFF(bt.due_date, NOW()) <= 3 THEN 'Due Soon'
        ELSE 'On Time'
    END as status_category,
    bt.status
FROM borrow_transactions bt
INNER JOIN members m ON bt.member_id = m.id
INNER JOIN books b ON bt.book_id = b.id
WHERE bt.return_date IS NULL
ORDER BY bt.due_date ASC;

CREATE VIEW vw_overdue_books AS
SELECT 
    bt.id as transaction_id,
    m.id as member_id,
    m.name as member_name,
    m.email as member_email,
    m.phone as member_phone,
    b.id as book_id,
    b.title as book_title,
    b.author as book_author,
    bt.borrow_date,
    bt.due_date,
    DATEDIFF(NOW(), bt.due_date) as days_overdue,
    bt.fine_amount as current_fine,
    CASE 
        WHEN DATEDIFF(NOW(), bt.due_date) <= 7 THEN 'Mild'
        WHEN DATEDIFF(NOW(), bt.due_date) <= 30 THEN 'Moderate'
        ELSE 'Severe'
    END as overdue_severity,
    ROUND(DATEDIFF(NOW(), bt.due_date) * 2.00, 2) as calculated_fine
FROM borrow_transactions bt
INNER JOIN members m ON bt.member_id = m.id
INNER JOIN books b ON bt.book_id = b.id
WHERE bt.return_date IS NULL 
AND bt.due_date < CURDATE()
ORDER BY days_overdue DESC;

-- Create indexes for better performance
CREATE INDEX idx_books_author ON books(author);
CREATE INDEX idx_books_genre ON books(genre);
CREATE INDEX idx_books_published_date ON books(published_date);
CREATE INDEX idx_members_email ON members(email);
CREATE INDEX idx_members_registration_date ON members(registration_date);
CREATE INDEX idx_borrow_member_id ON borrow_transactions(member_id);
CREATE INDEX idx_borrow_book_id ON borrow_transactions(book_id);
CREATE INDEX idx_borrow_dates ON borrow_transactions(borrow_date, due_date);
CREATE INDEX idx_borrow_status ON borrow_transactions(status);