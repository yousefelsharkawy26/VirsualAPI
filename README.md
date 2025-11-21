# Project Name: Dynamic Virtual API Platform

### 📖 Project Overview
This system is a full-stack **Mock Server & API Management Platform**. It allows developers to instantly create, manage, and simulate RESTful APIs without writing backend code. It is designed to accelerate frontend development, enable integration testing, and simulate complex server behaviors (like latency and errors).

### 🛠 Tech Stack
*   **Backend:** Node.js, Express.js
*   **Database:** MongoDB (Mongoose)
*   **Frontend:** HTML5, Tailwind CSS, Vanilla JavaScript
*   **Key Libraries:**
    *   `ajv`: High-performance JSON Schema validation.
    *   `@faker-js/faker`: Generating realistic random data.
    *   `path-to-regexp`: Handling dynamic URL parameters.

### ✨ Key Features

**1. Dynamic Endpoint Creation**
*   Create APIs with custom Methods (GET, POST, PUT, DELETE, PATCH).
*   Support for dynamic URL paths (e.g., `/users/:userId`).
*   **Smart Responses:** Inject variables like `{{params.userId}}`, `{{body.email}}`, or `{{query.page}}` directly into the response.

**2. Request Validation Engine**
*   **Header Validation:** Enforce specific headers (e.g., `x-api-key`).
*   **Body Schema Builder:** A visual UI to define strict data types (String, Number, Boolean) and required fields for incoming JSON bodies.

**3. Intelligent Data Simulation**
*   **Faker.js Integration:** Automatically generate random names, emails, IDs, dates, and cities using shortcodes (e.g., `{{$randomName}}`).
*   **Latency Simulation:** Configurable delay (in milliseconds) to simulate slow networks or server processing time.

**4. Management Dashboard**
*   A user-friendly web interface to Create, Read, Update, and Delete (CRUD) virtual endpoints.
*   **Request Logger:** Real-time visibility into all incoming traffic, including successful requests and validation errors (400/404/500).
*   **Variable Chips:** Quick-insert buttons for dynamic variables.

**5. Security**
*   Protected Admin API routes using an API Key (`x-admin-key`) to prevent unauthorized changes to the mock definitions.

### 🚀 How It Works
1.  **Define:** The user logs into the dashboard and creates a mock (e.g., `POST /login`).
2.  **Configure:** The user sets required fields (username, password) and the response template (token, user info).
3.  **Consume:** The frontend app calls the virtual URL. The system validates the request, waits for the configured delay, and returns the dynamic JSON response.
4.  **Monitor:** The user checks the dashboard logs to debug the request data.

### 🎯 Use Cases
*   **Frontend Development:** Build UI features before the real backend is ready.
*   **Error Handling:** Easily simulate 400 Bad Request or 500 Server Error states.
*   **Performance Testing:** Test how applications handle loading states using latency simulation.