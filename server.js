// server.js
const express = require('express');
const mongoose = require('mongoose');
const Ajv = require('ajv');
const cors = require('cors');
const { match } = require('path-to-regexp');

// Models & Utils
const Endpoint = require('./models/Endpoint');
const RequestLog = require('./models/RequestLog'); // <--- 1. Import Log Model
const processResponse = require('./utils/responseProcessor');
const adminAuth = require('./middleware/adminAuth'); // <--- 2. Import Auth

const app = express();
const ajv = new Ajv(); // Validator engine

app.use(express.static('public')); 
app.use(express.json());
app.use(cors());

// --- DB CONNECTION ---
mongoose.connect('mongodb://localhost:27017/virtual-api')
    .then(() => console.log('MongoDB Connected'))
    .catch(err => console.error(err));

// ==========================================
// 1. CONTROL PLANE (Management APIs)
// ==========================================

// GET List of all Endpoints (Protected)
app.get('/_system/endpoints', adminAuth, async (req, res) => {
    const endpoints = await Endpoint.find().sort({ path: 1 });
    res.json(endpoints);
});

// DELETE an Endpoint (Protected)
app.delete('/_system/endpoints/:id', adminAuth, async (req, res) => {
    await Endpoint.findByIdAndDelete(req.params.id);
    res.json({ message: "Deleted" });
});

// UPDATE an Endpoint (Protected)
app.put('/_system/endpoints/:id', adminAuth, async (req, res) => {
    try {
        const { path, method, bodySchema, requiredHeaders, response } = req.body;
        
        const updatedEndpoint = await Endpoint.findByIdAndUpdate(
            req.params.id, 
            { path, method, bodySchema, requiredHeaders, response },
            { new: true, runValidators: true }
        );

        if (!updatedEndpoint) {
            return res.status(404).json({ error: "Endpoint not found" });
        }

        res.json({ message: "Updated Successfully", endpoint: updatedEndpoint });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// CREATE a new Virtual API
app.post('/_system/create-endpoint', adminAuth,async (req, res) => {
    try {
        const { path, method, bodySchema, requiredHeaders, response } = req.body;

        const newEndpoint = await Endpoint.create({
            path, // e.g., "/login"
            method, // e.g., "POST"
            bodySchema, // JSON Schema object
            requiredHeaders,
            response
        });

        res.status(201).json({ message: "Virtual API Created", id: newEndpoint._id });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// NEW: API to view logs (Only for Admin)
app.get('/_system/logs', adminAuth, async (req, res) => {
    const logs = await RequestLog.find().sort({ timestamp: -1 }).limit(50);
    res.json(logs);
});

// ==========================================
// 2. DATA PLANE (The Virtual API Runner)
// ==========================================

// We use '/api/(.*)' to match anything after /api/
// This separates your "Virtual Mocks" from your "System/Management APIs"
app.all(/(.*)/, async (req, res) => {
    
    const requestedPath = req.path.replace(/^\/api/, '') || '/';
    const requestedMethod = req.method;
    
    // Log Object to be saved later
    const logEntry = {
        method: requestedMethod,
        path: requestedPath,
        requestHeaders: req.headers,
        requestBody: req.body,
        responseStatus: 500 // Default to 500 until success
    };

    try {
        // --- A. Matching Logic (Keep existing) ---
        const candidates = await Endpoint.find({ method: requestedMethod });
        let matchedEndpoint = null;
        let extractedParams = {};

        for (const candidate of candidates) {
            const matcher = match(candidate.path, { decode: decodeURIComponent });
            const result = matcher(requestedPath);
            if (result) {
                matchedEndpoint = candidate;
                extractedParams = result.params;
                break; 
            }
        }

        if (!matchedEndpoint) {
            logEntry.responseStatus = 404;
            logEntry.error = "Route not found";
            await RequestLog.create(logEntry); // Save Log
            return res.status(404).json({ error: "Virtual API path not found" });
        }

        logEntry.matchedEndpointId = matchedEndpoint._id;

        // --- Validation Logic (Keep existing) ---
        if (matchedEndpoint.requiredHeaders && matchedEndpoint.requiredHeaders.length > 0) {
            const missingHeaders = matchedEndpoint.requiredHeaders.filter(h => !req.get(h));
            if (missingHeaders.length > 0) {
                logEntry.responseStatus = 400;
                logEntry.error = "Missing Headers";
                await RequestLog.create(logEntry); // Save Log
                return res.status(400).json({ error: `Missing headers` });
            }
        }

        if (matchedEndpoint.bodySchema && ['POST', 'PUT', 'PATCH'].includes(requestedMethod)) {
            const validate = ajv.compile(matchedEndpoint.bodySchema);
            const valid = validate(req.body);
            if (!valid) {
                logEntry.responseStatus = 400;
                logEntry.error = "Schema Validation Failed";
                await RequestLog.create(logEntry); // Save Log
                return res.status(400).json({ error: "Schema validation failed", details: validate.errors });
            }
        }

        // --- Success Logic ---
        const finalBody = processResponse(matchedEndpoint.response.body, req, extractedParams);
        const delay = matchedEndpoint.response.delay || 0;

        // Update log for success
        logEntry.responseStatus = matchedEndpoint.response.statusCode;
        
        // Save log asynchronously (don't await, so we don't delay the user)
        RequestLog.create(logEntry).catch(err => console.error("Logging failed", err));

        setTimeout(() => {
            res.status(matchedEndpoint.response.statusCode).json(finalBody);
        }, delay);

    } catch (err) {
        console.error("Runner Error:", err);
        logEntry.error = err.message;
        await RequestLog.create(logEntry);
        res.status(500).json({ error: "Internal System Error" });
    }
});
// Start Server
app.listen(3000, () => console.log('Virtual System running on port 3000'));