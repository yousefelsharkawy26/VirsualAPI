// server.js (The runner)
const mongoose = require('mongoose');
const app = require('./app'); // Import the logic

const PORT = 3000;

// Connect to DB and then Start Server
mongoose.connect('mongodb+srv://Vercel-Admin-virsual-api-db:aCsyAtABZquXeEuQ@virsual-api-db.htjvflj.mongodb.net/?retryWrites=true&w=majority')
    .then(() => {
        console.log('MongoDB Connected');
        app.listen(PORT, () => console.log(`Virtual System running on port ${PORT}`));
    })
    .catch(err => console.error(err));
