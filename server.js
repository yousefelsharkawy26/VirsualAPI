// server.js (The runner)
const mongoose = require('mongoose');
const app = require('./app'); // Import the logic

const PORT = 3000;

// Connect to DB and then Start Server
mongoose.connect('mongodb://localhost:27017/virtual-api')
    .then(() => {
        console.log('MongoDB Connected');
        app.listen(PORT, () => console.log(`Virtual System running on port ${PORT}`));
    })
    .catch(err => console.error(err));