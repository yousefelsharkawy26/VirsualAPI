// server.js
require('dotenv').config(); // <--- 1. LOAD ENV VARS

const mongoose = require('mongoose');
const app = require('./app');

// <--- 2. USE ENV VARS
const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/virtual-api';

mongoose.connect(MONGO_URI)
    .then(() => {
        console.log('MongoDB Connected.');
        app.listen(PORT, () => console.log(`System running on port ${PORT}`));
    })
    .catch(err => console.error("DB Error:", err));