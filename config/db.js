const mysql = require('mysql');
const dotenv = require('dotenv');

dotenv.config();

// Create connection pool instead of single connection
const pool = mysql.createPool({
    connectionLimit: 10,
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'library_management',
    port: process.env.DB_PORT || 3306,
    acquireTimeout: 60000,
    timeout: 60000,
    reconnect: true,
    multipleStatements: true
});

// Handle connection pool events
pool.on('connection', function (connection) {
    console.log('Database connected as id ' + connection.threadId);
});

pool.on('error', function(err) {
    console.error('Database pool error:', err);
    if(err.code === 'PROTOCOL_CONNECTION_LOST') {
        console.log('Database connection was closed.');
    }
    if(err.code === 'ER_CON_COUNT_ERROR') {
        console.log('Database has too many connections.');
    }
    if(err.code === 'ECONNREFUSED') {
        console.log('Database connection was refused.');
    }
});

// Add promise wrapper for easier async/await usage
pool.promise = () => {
    return {
        query: (sql, params) => {
            return new Promise((resolve, reject) => {
                pool.query(sql, params, (error, results, fields) => {
                    if (error) {
                        reject(error);
                    } else {
                        resolve([results, fields]);
                    }
                });
            });
        },
        end: () => {
            return new Promise((resolve, reject) => {
                pool.end((error) => {
                    if (error) {
                        reject(error);
                    } else {
                        resolve();
                    }
                });
            });
        }
    };
};

module.exports = pool;