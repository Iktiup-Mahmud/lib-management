# Library Management System

This project is a Library Management System built using Node.js and Express. It provides functionalities for managing books, members, and borrowing transactions in a library setting.

## Project Structure

The project is organized into several directories and files, each serving a specific purpose:

```
library-management-system/
├── config/                     # Configuration files
│   └── db.js                   # MySQL DB connection with .env
│
├── controllers/                # Controller files for handling requests
│   ├── bookController.js
│   ├── memberController.js
│   ├── borrowController.js
│   └── dashboardController.js
│
├── models/                     # Model files for database interaction
│   ├── bookModel.js
│   ├── memberModel.js
│   ├── borrowModel.js
│   └── viewModel.js
│
├── routes/                     # Route files for defining API endpoints
│   ├── bookRoutes.js
│   ├── memberRoutes.js
│   ├── borrowRoutes.js
│   └── dashboardRoutes.js
│
├── views/                      # View templates for rendering UI
│   ├── partials/
│   │   ├── header.ejs
│   │   └── footer.ejs
│   ├── books/
│   │   ├── list.ejs
│   │   ├── add.ejs
│   │   └── edit.ejs
│   ├── members/
│   │   ├── list.ejs
│   │   ├── add.ejs
│   │   └── edit.ejs
│   ├── borrow/
│   │   ├── issue.ejs
│   │   ├── return.ejs
│   │   └── list.ejs
│   └── dashboard.ejs
│
├── public/                     # Static files for client-side
│   ├── css/
│   │   └── style.css
│   └── js/
│       └── main.js
│
├── sql/                        # SQL scripts for database setup
│   ├── create_tables.sql
│   ├── insert_dummy_data.sql
│   └── views.sql
│
├── docker/                     # Docker configuration
│   └── init.sql                # Final init script (merge create + dummy + views)
│
├── Dockerfile                  # App image config
├── docker-compose.yml          # Multi-container setup
├── .env                        # Environment variables (DB creds etc.)
├── .gitignore                  # Files to ignore in version control
├── package.json                # Project dependencies and scripts
├── server.js                   # Main Express app
└── README.md                   # Project documentation
```

## Getting Started

### Prerequisites

- Node.js
- MySQL
- Docker (optional)

### Installation

1. Clone the repository:
   ```
   git clone <repository-url>
   cd library-management-system
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Set up the database:
   - Create a `.env` file in the root directory and add your database credentials.

4. Run the application:
   ```
   node server.js
   ```

### Usage

- Access the application in your web browser at `http://localhost:3000`.
- Use the provided routes to manage books, members, and borrowing transactions.

## Contributing

Contributions are welcome! Please open an issue or submit a pull request for any improvements or bug fixes.

## License

This project is licensed under the MIT License. See the LICENSE file for details.# lib-management
