// Simple test script using Node.js built-in modules
const http = require('http');

const API_BASE = 'http://localhost:5000';

function makeRequest(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, API_BASE);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(body);
          resolve({ status: res.statusCode, data: jsonData });
        } catch (e) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

async function testAPI() {
  console.log('Testing Cirno Chat API...\n');

  try {
    // Test health check
    console.log('1. Testing health check...');
    const healthResponse = await makeRequest('GET', '/');
    console.log('Health check:', healthResponse.data);
    console.log('');

    // Test models endpoint
    console.log('2. Testing models endpoint...');
    const modelsResponse = await makeRequest('GET', '/api/models');
    console.log('Available models:', modelsResponse.data);
    console.log('');

    // Test chat endpoint
    console.log('3. Testing chat endpoint...');
    const chatResponse = await makeRequest('POST', '/api/chat', {
      message: 'Hello! Can you tell me a short joke?'
    });
    console.log('Chat response:', chatResponse.data);
    console.log('');

    // Test problem solver endpoint
    console.log('4. Testing problem solver endpoint...');
    const problemResponse = await makeRequest('POST', '/api/problem-solver', {
      message: 'Solve: 2x + 5 = 13'
    });
    console.log('Problem solver response:', problemResponse.data);
    console.log('');

  } catch (error) {
    console.error('Test failed:', error.message);
    console.log('\nMake sure the server is running: npm start');
  }
}

// Only run if this file is executed directly
if (require.main === module) {
  testAPI();
}

module.exports = { testAPI };
