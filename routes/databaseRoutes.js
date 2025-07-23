const express = require('express');
const db = require('../config/db');
const router = express.Router();

// Database viewer route
router.get('/database', async (req, res) => {
    try {
        // Get all tables
        const [tables] = await db.promise().query('SHOW TABLES');
        
        let tableData = {};
        
        // Get data from each table
        for (let table of tables) {
            const tableName = table[`Tables_in_${process.env.DB_NAME}`];
            try {
                const [rows] = await db.promise().query(`SELECT * FROM ${tableName} LIMIT 100`);
                const [columns] = await db.promise().query(`DESCRIBE ${tableName}`);
                tableData[tableName] = {
                    columns: columns,
                    rows: rows,
                    count: rows.length
                };
            } catch (error) {
                console.error(`Error fetching data from ${tableName}:`, error);
                tableData[tableName] = {
                    columns: [],
                    rows: [],
                    count: 0,
                    error: error.message
                };
            }
        }
        
        res.render('database/viewer', { 
            title: 'Database Viewer',
            tableData: tableData
        });
    } catch (error) {
        console.error('Database viewer error:', error);
        res.render('error', { 
            title: 'Database Error',
            message: 'Unable to fetch database information', 
            error: error 
        });
    }
});

module.exports = router;