// Test script to verify settings.html is working correctly
const http = require('http');

function makeRequest(url) {
    return new Promise((resolve, reject) => {
        http.get(url, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve({ status: res.statusCode, data }));
        }).on('error', reject);
    });
}

async function runTests() {
    console.log('=== Testing settings.html ===\n');
    
    let passed = 0;
    let failed = 0;
    
    // Test 1: Check if server is running
    try {
        const res = await makeRequest('http://localhost:3000/docs/settings.html');
        if (res.status === 200) {
            console.log('✓ Test 1 PASSED: Server is running and docs/settings.html loads');
            passed++;
        } else {
            console.log('✗ Test 1 FAILED: Server returned status ' + res.status);
            failed++;
        }
    } catch (e) {
        console.log('✗ Test 1 FAILED: Cannot connect to server - ' + e.message);
        failed++;
    }
    
    // Test 2: Check for dark/light button
    try {
        const res = await makeRequest('http://localhost:3000/docs/settings.html');
        const html = res.data;
        
        if (html.includes('theme-toggle') && html.includes('toggleTheme')) {
            console.log('✓ Test 2 PASSED: Dark/light toggle button element exists');
            passed++;
        } else {
            console.log('✗ Test 2 FAILED: Dark/light toggle button not found');
            failed++;
        }
    } catch (e) {
        console.log('✗ Test 2 FAILED: ' + e.message);
        failed++;
    }
    
    // Test 3: Check for Bootstrap CSS
    try {
        const res = await makeRequest('http://localhost:3000/docs/settings.html');
        const html = res.data;
        
        if (html.includes('bootstrap')) {
            console.log('✓ Test 3 PASSED: Bootstrap CSS is included');
            passed++;
        } else {
            console.log('✗ Test 3 FAILED: Bootstrap CSS not found');
            failed++;
        }
    } catch (e) {
        console.log('✗ Test 3 FAILED: ' + e.message);
        failed++;
    }
    
    // Test 4: Check for system-info API endpoint
    try {
        const res = await makeRequest('http://localhost:3000/api/system-info');
        const data = JSON.parse(res.data);
        
        if (data.homeDir && data.username) {
            console.log('✓ Test 4 PASSED: System info API works - user: ' + data.username + ', home: ' + data.homeDir);
            passed++;
        } else {
            console.log('✗ Test 4 FAILED: System info API missing data');
            failed++;
        }
    } catch (e) {
        console.log('✗ Test 4 FAILED: ' + e.message);
        failed++;
    }
    
    // Test 5: Check for favicon
    try {
        const res = await makeRequest('http://localhost:3000/favicon.ico');
        if (res.status === 200) {
            console.log('✓ Test 5 PASSED: favicon.ico is accessible');
            passed++;
        } else {
            console.log('✗ Test 5 FAILED: favicon.ico returned status ' + res.status);
            failed++;
        }
    } catch (e) {
        console.log('✗ Test 5 FAILED: ' + e.message);
        failed++;
    }
    
    // Test 6: Check CSS for button visibility
    try {
        const res = await makeRequest('http://localhost:3000/docs/settings.html');
        const html = res.data;
        
        // Check for key CSS properties that make button visible
        const hasPosition = html.includes('position: fixed');
        const hasZIndex = html.includes('z-index');
        const hasSize = html.includes('width:') && html.includes('height:');
        
        if (hasPosition && hasZIndex && hasSize) {
            console.log('✓ Test 6 PASSED: Button has proper CSS positioning');
            passed++;
        } else {
            console.log('✗ Test 6 FAILED: Button CSS may not be visible');
            failed++;
        }
    } catch (e) {
        console.log('✗ Test 6 FAILED: ' + e.message);
        failed++;
    }
    
    console.log('\n=== Test Results ===');
    console.log('Passed: ' + passed);
    console.log('Failed: ' + failed);
    console.log('===================');
    
    if (failed === 0) {
        console.log('\nAll tests passed! The dark/light button should be visible.');
        console.log('Open http://localhost:3000/docs/settings.html in your browser.');
    } else {
        console.log('\nSome tests failed. Please check the errors above.');
    }
}

runTests();
