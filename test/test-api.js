// API Test Script
const http = require('http');
const PORT = require('../config.json').port || 3006;

function makeRequest(url, method = 'GET', data = null) {
    return new Promise((resolve, reject) => {
        const urlObj = new URL(url);
        const options = {
            hostname: urlObj.hostname,
            port: urlObj.port || PORT,
            path: urlObj.pathname,
            method: method,
            headers: data ? { 'Content-Type': 'application/json' } : {}
        };
        
        const req = http.request(options, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => {
                try {
                    resolve({ status: res.statusCode, data: body ? JSON.parse(body) : null });
                } catch (e) {
                    resolve({ status: res.statusCode, data: body });
                }
            });
        });
        
        req.on('error', reject);
        if (data) req.write(JSON.stringify(data));
        req.end();
    });
}

async function runTests() {
    console.log('=== Testing MyHomepage API ===\n');
    
    let passed = 0;
    let failed = 0;
    
    // Test 1: Get all buttons
    try {
        const res = await makeRequest(`http://localhost:${PORT}/api/buttons`);
        if (res.status === 200 && Array.isArray(res.data)) {
            console.log('✓ Test 1 PASSED: GET /api/buttons returns array');
            passed++;
        } else {
            console.log('✗ Test 1 FAILED: Expected array');
            failed++;
        }
    } catch (e) {
        console.log('✗ Test 1 FAILED: ' + e.message);
        failed++;
    }
    
    // Test 2: Add new button with name
    try {
        const res = await makeRequest(`http://localhost:${PORT}/api/buttons`, 'POST', {
            name: 'Test Button',
            url: 'https://test-example.com',
            color: '#ff0000'
        });
        if (res.status === 201 && res.data.name === 'Test Button') {
            console.log('✓ Test 2 PASSED: POST /api/buttons creates button with name');
            passed++;
        } else {
            console.log('✗ Test 2 FAILED: Expected status 201');
            failed++;
        }
    } catch (e) {
        console.log('✗ Test 2 FAILED: ' + e.message);
        failed++;
    }
    
    // Test 3: Add button without name (auto-generate)
    try {
        const res = await makeRequest(`http://localhost:${PORT}/api/buttons`, 'POST', {
            url: 'https://example.com'
        });
        if (res.status === 201 && res.data.name === 'Example.com') {
            console.log('✓ Test 3 PASSED: POST /api/buttons auto-generates name from URL');
            passed++;
        } else {
            console.log('✗ Test 3 FAILED: Expected name "Example.com", got: ' + (res.data ? res.data.name : 'none'));
            failed++;
        }
    } catch (e) {
        console.log('✗ Test 3 FAILED: ' + e.message);
        failed++;
    }
    
    // Test 4: Add button without www prefix
    try {
        const res = await makeRequest(`http://localhost:${PORT}/api/buttons`, 'POST', {
            url: 'https://www.google.com'
        });
        if (res.status === 201 && res.data.name === 'Google.com') {
            console.log('✓ Test 4 PASSED: POST /api/buttons handles www prefix');
            passed++;
        } else {
            console.log('✗ Test 4 FAILED: Expected name "Google.com", got: ' + (res.data ? res.data.name : 'none'));
            failed++;
        }
    } catch (e) {
        console.log('✗ Test 4 FAILED: ' + e.message);
        failed++;
    }
    
    // Test 5: Prevent duplicate URL
    try {
        const res = await makeRequest(`http://localhost:${PORT}/api/buttons`, 'POST', {
            url: 'https://test-example.com'
        });
        if (res.status === 400 && res.data.error && res.data.error.includes('already exists')) {
            console.log('✓ Test 5 PASSED: POST /api/buttons prevents duplicate URL');
            passed++;
        } else {
            console.log('✗ Test 5 FAILED: Expected 400 error for duplicate');
            failed++;
        }
    } catch (e) {
        console.log('✗ Test 5 FAILED: ' + e.message);
        failed++;
    }
    
    // Test 6: URL without name required
    try {
        const res = await makeRequest(`http://localhost:${PORT}/api/buttons`, 'POST', {
            name: 'No URL Button'
        });
        if (res.status === 400 && res.data.error && res.data.error.includes('URL is required')) {
            console.log('✓ Test 6 PASSED: POST /api/buttons requires URL');
            passed++;
        } else {
            console.log('✗ Test 6 FAILED: Expected 400 error for missing URL');
            failed++;
        }
    } catch (e) {
        console.log('✗ Test 6 FAILED: ' + e.message);
        failed++;
    }
    
    // Test 7: System info API
    try {
        const res = await makeRequest(`http://localhost:${PORT}/api/system-info`);
        if (res.status === 200 && res.data.username && res.data.homeDir) {
            console.log('✓ Test 7 PASSED: GET /api/system-info works');
            passed++;
        } else {
            console.log('✗ Test 7 FAILED: Missing system info');
            failed++;
        }
    } catch (e) {
        console.log('✗ Test 7 FAILED: ' + e.message);
        failed++;
    }
    
    // Test 8: Case-insensitive duplicate check
    try {
        const res = await makeRequest(`http://localhost:${PORT}/api/buttons`, 'POST', {
            url: 'HTTPS://EXAMPLE.COM'
        });
        if (res.status === 400 && res.data.error && res.data.error.includes('already exists')) {
            console.log('✓ Test 8 PASSED: Duplicate check is case-insensitive');
            passed++;
        } else {
            console.log('✗ Test 8 FAILED: Expected 400 for case-insensitive duplicate');
            failed++;
        }
    } catch (e) {
        console.log('✗ Test 8 FAILED: ' + e.message);
        failed++;
    }
    
    console.log('\n=== Test Results ===');
    console.log('Passed: ' + passed);
    console.log('Failed: ' + failed);
    console.log('===================');
    
    if (failed === 0) {
        console.log('\nAll API tests passed! ✓');
    } else {
        console.log('\nSome tests failed. Please check the errors above.');
    }
}

runTests();
