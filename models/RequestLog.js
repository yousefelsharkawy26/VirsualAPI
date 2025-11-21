// models/RequestLog.js
const mongoose = require('mongoose');

const requestLogSchema = new mongoose.Schema({
    timestamp: { type: Date, default: Date.now },
    method: String,
    path: String,
    requestHeaders: Object,
    requestBody: Object,
    responseStatus: Number,
    matchedEndpointId: { type: mongoose.Schema.Types.ObjectId, ref: 'Endpoint' },
    error: String // To store why it failed (e.g., "Body validation failed")
});

module.exports = mongoose.model('RequestLog', requestLogSchema);