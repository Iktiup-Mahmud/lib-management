INSERT INTO books (title, author, genre, published_year, quantity) VALUES
('The Great Gatsby', 'F. Scott Fitzgerald', 'Fiction', 1925, 5),
('To Kill a Mockingbird', 'Harper Lee', 'Fiction', 1960, 3),
('1984', 'George Orwell', 'Dystopian', 1949, 4),
('Pride and Prejudice', 'Jane Austen', 'Romance', 1813, 2),
('The Catcher in the Rye', 'J.D. Salinger', 'Fiction', 1951, 6);

INSERT INTO members (name, email, phone, membership_date) VALUES
('John Doe', 'john.doe@example.com', '123-456-7890', '2023-01-15'),
('Jane Smith', 'jane.smith@example.com', '098-765-4321', '2023-02-20'),
('Alice Johnson', 'alice.johnson@example.com', '555-123-4567', '2023-03-10'),
('Bob Brown', 'bob.brown@example.com', '444-987-6543', '2023-04-05');

INSERT INTO borrow_transactions (member_id, book_id, borrow_date, return_date) VALUES
(1, 1, '2023-05-01', NULL),
(2, 3, '2023-05-02', '2023-05-15'),
(1, 2, '2023-05-03', NULL),
(3, 4, '2023-05-04', '2023-05-20');