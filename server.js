require('dotenv').config({ path: require('path').join(__dirname, '.env') });

const express = require('express');
const cors = require('cors');
const path = require('path');
const mongoose = require('mongoose'); // Added mongoose here
const connectDB = require('./config/db');

const app = express();

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/items', require('./routes/items'));
app.use('/api/claims', require('./routes/claims'));

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
    res.json({
        message: 'Campus Lost & Found API is running'
    });
});

const PORT = process.env.PORT || 5000;

// Wrap the startup in an async function so we can wait for DB to connect
const startServer = async () => {
    try {
        // 1. Wait for the database to connect first
        await connectDB(); 
        
        // 2. Only start listening if DB connected successfully
        app.listen(PORT, "0.0.0.0", () => {
            console.log(`Server running on port ${PORT}`);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
    }
};

startServer();