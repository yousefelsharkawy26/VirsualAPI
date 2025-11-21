// utils/responseProcessor.js
const { faker } = require('@faker-js/faker');

// UPDATE: Added "params" to the arguments
function processResponse(templateBody, req, params = {}) {
    let bodyString = JSON.stringify(templateBody);

    bodyString = bodyString.replace(/\{\{(.+?)\}\}/g, (match, content) => {
        const token = content.trim();

        if (token.startsWith('body.')) {
            const field = token.split('.')[1];
            return req.body[field] || match;
        }

        if (token.startsWith('query.')) {
            const field = token.split('.')[1];
            return req.query[field] || match;
        }

        // --- NEW CASE D: Path Parameters (e.g., {{params.userId}}) ---
        if (token.startsWith('params.')) {
            const field = token.split('.')[1];
            return params[field] || match;
        }

        const fakerMap = {
            '$randomId': () => faker.string.uuid(),
            '$randomName': () => faker.person.fullName(),
            '$randomEmail': () => faker.internet.email(),
            '$randomCity': () => faker.location.city(),
            '$randomDate': () => faker.date.recent().toISOString(),
            '$randomImage': () => faker.image.avatar()
        };

        if (fakerMap[token]) {
            return fakerMap[token]();
        }

        return match;
    });

    try {
        return JSON.parse(bodyString);
    } catch (e) {
        return templateBody;
    }
}

module.exports = processResponse;