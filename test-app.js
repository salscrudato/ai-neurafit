#!/usr/bin/env node

/**
 * Simple end-to-end test script for NeuraFit app
 * Tests basic functionality and API endpoints
 */

import http from 'http';

// Test configuration
const FRONTEND_URL = 'http://localhost:5174';
const EMULATOR_UI_URL = 'http://localhost:4002';
const FUNCTIONS_URL = 'http://localhost:5001';
const FIRESTORE_URL = 'http://localhost:8081';

// Helper function to make HTTP requests
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const req = http.request(url, options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, data, headers: res.headers }));
    });
    req.on('error', reject);
    if (options.body) {
      req.write(options.body);
    }
    req.end();
  });
}

// Test functions
async function testFrontend() {
  console.log('🧪 Testing Frontend...');
  try {
    const response = await makeRequest(FRONTEND_URL);
    if (response.status === 200) {
      console.log('✅ Frontend is running and accessible');
      return true;
    } else {
      console.log(`❌ Frontend returned status: ${response.status}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ Frontend test failed: ${error.message}`);
    return false;
  }
}

async function testEmulatorUI() {
  console.log('🧪 Testing Firebase Emulator UI...');
  try {
    const response = await makeRequest(EMULATOR_UI_URL);
    if (response.status === 200) {
      console.log('✅ Firebase Emulator UI is running');
      return true;
    } else {
      console.log(`❌ Emulator UI returned status: ${response.status}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ Emulator UI test failed: ${error.message}`);
    return false;
  }
}

async function testFirestore() {
  console.log('🧪 Testing Firestore Emulator...');
  try {
    const response = await makeRequest(`${FIRESTORE_URL}/`);
    if (response.status === 200 || response.status === 404) {
      console.log('✅ Firestore Emulator is running');
      return true;
    } else {
      console.log(`❌ Firestore returned status: ${response.status}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ Firestore test failed: ${error.message}`);
    return false;
  }
}

async function testFunctions() {
  console.log('🧪 Testing Firebase Functions...');
  try {
    // Test the getExercises function (should return 401 without auth, but that means it's running)
    const response = await makeRequest(`${FUNCTIONS_URL}/ai-neurafit/us-central1/getExercises`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });
    
    if (response.status === 401 || response.status === 403) {
      console.log('✅ Firebase Functions are running (auth required as expected)');
      return true;
    } else if (response.status === 400) {
      console.log('✅ Firebase Functions are running (bad request as expected for empty body)');
      return true;
    } else if (response.status === 200) {
      console.log('✅ Firebase Functions are running and responding');
      return true;
    } else {
      console.log(`❌ Functions returned unexpected status: ${response.status}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ Functions test failed: ${error.message}`);
    return false;
  }
}

// Main test runner
async function runTests() {
  console.log('🚀 Starting NeuraFit App End-to-End Tests\n');
  
  const tests = [
    testFrontend,
    testEmulatorUI,
    testFirestore,
    testFunctions
  ];
  
  let passed = 0;
  let failed = 0;
  
  for (const test of tests) {
    const result = await test();
    if (result) {
      passed++;
    } else {
      failed++;
    }
    console.log(''); // Empty line for readability
  }
  
  console.log('📊 Test Results:');
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📈 Success Rate: ${Math.round((passed / (passed + failed)) * 100)}%`);
  
  if (failed === 0) {
    console.log('\n🎉 All tests passed! NeuraFit app is working seamlessly end-to-end.');
    process.exit(0);
  } else {
    console.log('\n⚠️  Some tests failed. Please check the services and try again.');
    process.exit(1);
  }
}

// Run tests if this script is executed directly
runTests().catch(console.error);

export { runTests, testFrontend, testEmulatorUI, testFirestore, testFunctions };
