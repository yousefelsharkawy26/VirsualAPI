// tests/unit/responseProcessor.test.js
const processResponse = require('../../utils/responseProcessor');

describe('Response Processor Logic', () => {
    
    // 1. Test Basic String Replacement
    test('should replace {{body.name}} with actual request data', () => {
        const template = { message: "Hello {{body.name}}" };
        const req = { body: { name: "Ahmed" } };
        
        const result = processResponse(template, req);
        
        expect(result.message).toBe("Hello Ahmed");
    });

    // 2. Test Fallback (if data missing)
    test('should return original tag if data is missing', () => {
        const template = { message: "Hello {{body.missing}}" };
        const req = { body: {} };
        
        const result = processResponse(template, req);
        
        expect(result.message).toBe("Hello {{body.missing}}");
    });

    // 3. Test URL Parameters
    test('should replace {{params.id}}', () => {
        const template = { id: "{{params.userId}}" };
        const req = {}; // Req not used for params in our updated logic
        const params = { userId: "101" };

        const result = processResponse(template, req, params);

        expect(result.id).toBe("101");
    });

    // 4. Test Faker (Random Data)
    test('should generate a random UUID for {{$randomId}}', () => {
        const template = { id: "{{$randomId}}" };
        const req = {};

        const result = processResponse(template, req);

        // We don't know the exact ID, but we know it shouldn't be the tag
        expect(result.id).not.toBe("{{$randomId}}");
        expect(result.id.length).toBeGreaterThan(10);
    });
});