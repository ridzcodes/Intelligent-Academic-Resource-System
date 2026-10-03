/**
 * Integration Test for Express AI Semantic Search
 * ================================================
 * Tests:
 * 1. Express API endpoint GET /api/ai/health
 * 2. Express API endpoint POST /api/ai/semantic-search
 * 3. Error handling when query is invalid
 * 
 * Run command:
 *   node test_semantic_search.js
 */

const http = require('http');
const app = require('./src/app');

const PORT = 5099; // Test port

const runTests = async () => {
  console.log('='.repeat(75));
  console.log('STARTING BACKEND TEST SUITE: Express AI Semantic Search Endpoint');
  console.log('='.repeat(75));

  const server = app.listen(PORT, async () => {
    try {
      // -------------------------------------------------------------------
      // Test 1: Root API Health
      // -------------------------------------------------------------------
      console.log('\n[TEST 1] Testing Server API Health Check (/api/health)...');
      const healthRes = await fetch(`http://localhost:${PORT}/api/health`);
      const healthData = await healthRes.json();
      if (healthRes.status === 200 && healthData.status === 'ok') {
        console.log(' [PASS] Express API is online and healthy.');
      } else {
        throw new Error(`Health check failed with status: ${healthRes.status}`);
      }

      // -------------------------------------------------------------------
      // Test 2: Validation of Empty Query on Semantic Search
      // -------------------------------------------------------------------
      console.log('\n[TEST 2] Testing Semantic Search Validation on empty query...');
      const emptyRes = await fetch(`http://localhost:${PORT}/api/ai/semantic-search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: '' }),
      });
      const emptyData = await emptyRes.json();
      if (emptyRes.status === 400 && emptyData.success === false) {
        console.log(' [PASS] Correctly rejected empty query with 400 Bad Request.');
      } else {
        throw new Error(`Expected 400 Bad Request, got: ${emptyRes.status}`);
      }

      // -------------------------------------------------------------------
      // Test 3: Semantic Search Endpoint with query (live or offline handling)
      // -------------------------------------------------------------------
      console.log('\n[TEST 3] Testing Semantic Search Endpoint execution...');
      const searchRes = await fetch(`http://localhost:${PORT}/api/ai/semantic-search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: 'Database transactions and ACID properties', top_k: 3 }),
      });
      const searchData = await searchRes.json();

      if (searchRes.status === 200 && searchData.success === true) {
        console.log(' [PASS] Successfully executed semantic search via Python AI microservice!');
        console.log(`        Query: "${searchData.query}", Results: ${searchData.totalResults}`);
      } else if (searchRes.status === 503 && searchData.isAiOffline === true) {
        console.log(' [PASS] Gracefully handled AI microservice offline status with 503 Service Unavailable.');
        console.log(`        Message: "${searchData.message}"`);
      } else {
        throw new Error(`Unexpected status code: ${searchRes.status}, data: ${JSON.stringify(searchData)}`);
      }

      console.log('\n' + '='.repeat(75));
      console.log(' ALL BACKEND TESTS PASSED SUCCESSFULLY!');
      console.log('='.repeat(75));
    } catch (err) {
      console.error('\n [FAIL] Test Error:', err.message);
      process.exitCode = 1;
    } finally {
      server.close();
    }
  });
};

runTests();
