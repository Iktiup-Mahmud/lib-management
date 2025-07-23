-- Enhanced SQL script to create tables with all constraints for library management system

-- Table for storing book information
CREATE TABLE books (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    author VARCHAR(255) NOT NULL,
    genre VARCHAR(100) NOT NULL,
    published_date DATE NOT NULL,
    isbn VARCHAR(20) UNIQUE,
    available_copies INT DEFAULT 1 CHECK (available_copies >= 0),
    total_copies INT DEFAULT 1 CHECK (total_copies > 0),
    price DECIMAL(10,2) CHECK (price >= 0),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Table for storing member information
CREATE TABLE members (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(15) NOT NULL,
    address TEXT NOT NULL,
    registration_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    membership_type ENUM('REGULAR', 'PREMIUM', 'STUDENT') DEFAULT 'REGULAR',
    is_active BOOLEAN DEFAULT TRUE,
    max_books_allowed INT DEFAULT 3 CHECK (max_books_allowed > 0),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT chk_email_format CHECK (email REGEXP '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- Table for storing borrowing transactions
CREATE TABLE borrow_transactions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    book_id INT NOT NULL,
    member_id INT NOT NULL,
    borrow_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    due_date DATE NOT NULL,
    return_date TIMESTAMP NULL,
    fine_amount DECIMAL(10,2) DEFAULT 0.00 CHECK (fine_amount >= 0),
    status ENUM('BORROWED', 'RETURNED', 'OVERDUE') DEFAULT 'BORROWED',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT chk_dates CHECK (due_date >= DATE(borrow_date)),
    CONSTRAINT chk_return_date CHECK (return_date IS NULL OR return_date >= borrow_date)
);

-- Table for book categories (3NF normalization)
CREATE TABLE categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Junction table for book-category relationship (many-to-many)
CREATE TABLE book_categories (
    book_id INT NOT NULL,
    category_id INT NOT NULL,
    PRIMARY KEY (book_id, category_id),
    FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
);

-- Table for tracking fines
CREATE TABLE fines (
    id INT AUTO_INCREMENT PRIMARY KEY,
    transaction_id INT NOT NULL,
    amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
    reason VARCHAR(255) NOT NULL,
    paid BOOLEAN DEFAULT FALSE,
    paid_date TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (transaction_id) REFERENCES borrow_transactions(id) ON DELETE CASCADE
);

-- Indexes for better performance
CREATE INDEX idx_books_author ON books(author);
CREATE INDEX idx_books_genre ON books(genre);
CREATE INDEX idx_books_published_date ON books(published_date);
CREATE INDEX idx_members_email ON members(email);
CREATE INDEX idx_members_registration_date ON members(registration_date);
CREATE INDEX idx_borrow_member_id ON borrow_transactions(member_id);
CREATE INDEX idx_borrow_book_id ON borrow_transactions(book_id);
CREATE INDEX idx_borrow_dates ON borrow_transactions(borrow_date, due_date);
CREATE INDEX idx_borrow_status ON borrow_transactions(status);