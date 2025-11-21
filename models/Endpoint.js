// models/Endpoint.js
const mongoose = require('mongoose');

const endpointSchema = new mongoose.Schema({
    // The path the user wants to mock (e.g., "/users/create")
    path: { 
        type: String, 
        required: true 
    },
    // The HTTP method (GET, POST, PUT, etc.)
    method: { 
        type: String, 
        required: true,
        uppercase: true 
    },
    // The JSON Schema to validate the incoming request body
    bodySchema: { 
        type: Object, 
        default: null 
    },
    // The headers we expect (Simple key-value for Phase 1)
    requiredHeaders: {
        type: [String],
        default: []
    },
    // What the system should send back
    response: {
        statusCode: { type: Number, default: 200 },
        body: { type: Object, default: {} },
        delay: { type: Number, default: 0 } // <--- ADD THIS (Time in milliseconds)
    }
});

// Ensure a user can't define the same Method+Path twice
endpointSchema.index({ path: 1, method: 1 }, { unique: true });

module.exports = mongoose.model('Endpoint', endpointSchema);