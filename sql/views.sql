-- Comprehensive SQL views for the library management system

-- View 1: Available Books with detailed information (JOIN + AGGREGATION)
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

-- View 2: Member Statistics with borrowing history (COMPLEX QUERY with JOINS and AGGREGATIONS)
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

-- View 3: Current Borrowing Status (COMPLEX JOIN with date calculations)
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

-- View 4: Popular Books Report (AGGREGATION with ranking)
CREATE VIEW vw_popular_books AS
SELECT 
    b.id,
    b.title,
    b.author,
    b.genre,
    b.published_date,
    COUNT(bt.id) as total_borrows,
    COUNT(CASE WHEN bt.return_date IS NULL THEN 1 END) as currently_borrowed,
    COUNT(DISTINCT bt.member_id) as unique_borrowers,
    COALESCE(AVG(DATEDIFF(COALESCE(bt.return_date, NOW()), bt.borrow_date)), 0) as avg_borrow_days,
    MAX(bt.borrow_date) as last_borrowed,
    MIN(bt.borrow_date) as first_borrowed,
    ROUND((COUNT(bt.id) / b.total_copies), 2) as borrow_rate_per_copy
FROM books b
LEFT JOIN borrow_transactions bt ON b.id = bt.book_id
GROUP BY b.id, b.title, b.author, b.genre, b.published_date, b.total_copies
HAVING total_borrows > 0
ORDER BY total_borrows DESC, unique_borrowers DESC;

-- View 5: Monthly Borrowing Statistics (DATE functions with AGGREGATION)
CREATE VIEW vw_monthly_statistics AS
SELECT 
    YEAR(bt.borrow_date) as borrow_year,
    MONTH(bt.borrow_date) as borrow_month,
    MONTHNAME(bt.borrow_date) as month_name,
    COUNT(*) as total_borrows,
    COUNT(CASE WHEN bt.return_date IS NOT NULL THEN 1 END) as returned_books,
    COUNT(CASE WHEN bt.return_date IS NULL THEN 1 END) as still_borrowed,
    COUNT(CASE WHEN bt.status = 'OVERDUE' THEN 1 END) as overdue_books,
    COUNT(DISTINCT bt.member_id) as unique_members,
    COUNT(DISTINCT bt.book_id) as unique_books,
    COALESCE(SUM(bt.fine_amount), 0) as total_fines_generated,
    COALESCE(AVG(DATEDIFF(COALESCE(bt.return_date, NOW()), bt.borrow_date)), 0) as avg_borrow_duration
FROM borrow_transactions bt
GROUP BY YEAR(bt.borrow_date), MONTH(bt.borrow_date), MONTHNAME(bt.borrow_date)
ORDER BY borrow_year DESC, borrow_month DESC;

-- View 6: Overdue Books Report (COMPLEX QUERY with multiple conditions)
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

-- View 7: Book Availability Summary (AGGREGATION by genre)
CREATE VIEW vw_book_availability_by_genre AS
SELECT 
    b.genre,
    COUNT(*) as total_books,
    SUM(b.total_copies) as total_copies,
    SUM(b.available_copies) as available_copies,
    SUM(b.total_copies - b.available_copies) as borrowed_copies,
    ROUND((SUM(b.available_copies) / SUM(b.total_copies)) * 100, 2) as availability_percentage,
    COUNT(DISTINCT b.author) as unique_authors,
    MIN(b.published_date) as oldest_book_date,
    MAX(b.published_date) as newest_book_date
FROM books b
GROUP BY b.genre
ORDER BY total_books DESC;