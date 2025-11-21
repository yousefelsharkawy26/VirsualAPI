// tests/integration/system.test.js
const request = require('supertest');
const app = require('../../app');
const Endpoint = require('../../models/Endpoint');
const RequestLog = require('../../models/RequestLog');
const mongoose = require('mongoose');

// --- MOCK THE DATABASE ---
// We tell Jest: "Don't actually touch MongoDB, just pretend."
jest.mock('../../models/Endpoint'); 
jest.mock('../../models/RequestLog');

describe('System API Routes', () => {

    // Clear mocks before each test
    beforeEach(() => {
        jest.clearAllMocks();
    });

    // Test 1: Create Endpoint Security
    test('POST /_system/create-endpoint should fail without Admin Key', async () => {
        const response = await request(app)
            .post('/_system/create-endpoint')
            .send({ path: '/test', method: 'GET' });

        expect(response.statusCode).toBe(403); // Forbidden
        expect(response.body.error).toContain('Invalid Admin Key');
    });

    // Test 2: Create Endpoint Success
    test('POST /_system/create-endpoint should succeed with Admin Key', async () => {
        // Mock the Mongoose .create() function
        Endpoint.create.mockResolvedValue({ _id: 'mock_id_123', path: '/test' });

        const response = await request(app)
            .post('/_system/create-endpoint')
            .set('x-admin-key', 'my-secret-admin-key') // Set Header
            .send({ 
                path: '/test', 
                method: 'GET',
                response: { statusCode: 200, body: {} } 
            });

        expect(response.statusCode).toBe(201);
        expect(response.body.message).toBe("Virtual API Created");
        expect(Endpoint.create).toHaveBeenCalledTimes(1);
    });

    // Test 3: Virtual API Execution (The Mock Engine)
    test('GET /api/users/123 should return mocked response', async () => {
        // 1. Mock finding the endpoint in DB
        Endpoint.find.mockResolvedValue([
            {
                path: '/users/:id',
                method: 'GET',
                requiredHeaders: [],
                response: { statusCode: 200, body: { id: '{{params.id}}' } }
            }
        ]);

        // 2. Mock creating a log
        RequestLog.create.mockResolvedValue({});

        // 3. Send Request
        const response = await request(app).get('/api/users/123');

        expect(response.statusCode).toBe(200);
        expect(response.body.id).toBe("123"); // It processed the param!
    });

    // Test 4: Virtual API 404
    test('GET /api/unknown should return 404', async () => {
        Endpoint.find.mockResolvedValue([]); // No endpoints found

        const response = await request(app).get('/api/unknown');

        expect(response.statusCode).toBe(404);
    });

});