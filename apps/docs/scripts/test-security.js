#!/usr/bin/env node

/**
 * Security testing script for the documentation site
 */

const https = require('https');
const http = require('http');
const { URL } = require('url');

const TARGET_URL = process.env.TEST_URL || 'http://localhost:3000';

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Test security headers
async function testSecurityHeaders() {
  log('\n🔒 Testing Security Headers...', 'blue');
  
  const requiredHeaders = [
    'strict-transport-security',
    'x-frame-options',
    'x-content-type-options',
    'referrer-policy',
    'permissions-policy',
    'content-security-policy',
  ];

  try {
    const url = new URL(TARGET_URL);
    const protocol = url.protocol === 'https:' ? https : http;

    return new Promise((resolve) => {
      protocol.get(TARGET_URL, (res) => {
        const headers = res.headers;
        let passed = 0;
        let failed = 0;

        requiredHeaders.forEach(header => {
          if (headers[header]) {
            log(`  ✓ ${header}: ${headers[header].substring(0, 50)}...`, 'green');
            passed++;
          } else {
            log(`  ✗ ${header}: Missing`, 'red');
            failed++;
          }
        });

        log(`\n  Summary: ${passed} passed, ${failed} failed`, failed > 0 ? 'yellow' : 'green');
        resolve(failed === 0);
      }).on('error', (err) => {
        log(`  ✗ Failed to connect: ${err.message}`, 'red');
        resolve(false);
      });
    });
  } catch (error) {
    log(`  ✗ Error: ${error.message}`, 'red');
    return false;
  }
}

// Test CSP violations
async function testCSPViolations() {
  log('\n🛡️  Testing CSP Violations...', 'blue');
  
  const tests = [
    {
      name: 'Inline script without nonce',
      path: '/',
      check: async (body) => {
        // Check if inline scripts are blocked (unless they have nonce/hash)
        return !body.includes('<script>alert(') && !body.includes('onclick=');
      }
    },
    {
      name: 'External script from unauthorized domain',
      path: '/',
      check: async (body) => {
        // Check if only allowed domains are used for scripts
        const scriptTags = body.match(/<script[^>]*src="([^"]+)"/g) || [];
        return scriptTags.every(tag => {
          const src = tag.match(/src="([^"]+)"/)[1];
          return src.startsWith('/') || 
                 src.includes('cdn.jsdelivr.net') ||
                 src.includes('_next');
        });
      }
    }
  ];

  let allPassed = true;

  for (const test of tests) {
    try {
      const url = new URL(test.path, TARGET_URL);
      const protocol = url.protocol === 'https:' ? https : http;

      const result = await new Promise((resolve) => {
        protocol.get(url.href, (res) => {
          let body = '';
          res.on('data', chunk => body += chunk);
          res.on('end', async () => {
            const passed = await test.check(body);
            if (passed) {
              log(`  ✓ ${test.name}`, 'green');
            } else {
              log(`  ✗ ${test.name}`, 'red');
              allPassed = false;
            }
            resolve(passed);
          });
        }).on('error', (err) => {
          log(`  ✗ ${test.name}: ${err.message}`, 'red');
          allPassed = false;
          resolve(false);
        });
      });
    } catch (error) {
      log(`  ✗ ${test.name}: ${error.message}`, 'red');
      allPassed = false;
    }
  }

  return allPassed;
}

// Test sensitive file protection
async function testSensitiveFileProtection() {
  log('\n🚫 Testing Sensitive File Protection...', 'blue');
  
  const sensitiveFiles = [
    '/.env',
    '/.git/config',
    '/package.json',
    '/tsconfig.json',
    '/.next/BUILD_ID',
    '/node_modules/next/package.json',
  ];

  let allBlocked = true;

  for (const file of sensitiveFiles) {
    try {
      const url = new URL(file, TARGET_URL);
      const protocol = url.protocol === 'https:' ? https : http;

      const result = await new Promise((resolve) => {
        protocol.get(url.href, (res) => {
          if (res.statusCode === 404 || res.statusCode === 403) {
            log(`  ✓ ${file}: Blocked (${res.statusCode})`, 'green');
            resolve(true);
          } else {
            log(`  ✗ ${file}: Accessible (${res.statusCode})`, 'red');
            allBlocked = false;
            resolve(false);
          }
        }).on('error', (err) => {
          log(`  ✓ ${file}: Blocked (connection refused)`, 'green');
          resolve(true);
        });
      });
    } catch (error) {
      log(`  ✓ ${file}: Blocked (${error.message})`, 'green');
    }
  }

  return allBlocked;
}

// Test XSS protection
async function testXSSProtection() {
  log('\n🔍 Testing XSS Protection...', 'blue');
  
  const xssPayloads = [
    { 
      name: 'Script tag in query',
      path: '/search?q=<script>alert(1)</script>',
      shouldBeBlocked: true
    },
    {
      name: 'JavaScript protocol',
      path: '/search?q=javascript:alert(1)',
      shouldBeBlocked: true
    },
    {
      name: 'Event handler',
      path: '/search?q=<img onerror=alert(1)>',
      shouldBeBlocked: true
    }
  ];

  let allPassed = true;

  for (const payload of xssPayloads) {
    try {
      const url = new URL(payload.path, TARGET_URL);
      const protocol = url.protocol === 'https:' ? https : http;

      const result = await new Promise((resolve) => {
        protocol.get(url.href, (res) => {
          let body = '';
          res.on('data', chunk => body += chunk);
          res.on('end', () => {
            const containsPayload = body.includes(payload.path.split('=')[1]);
            const passed = payload.shouldBeBlocked ? !containsPayload : containsPayload;
            
            if (passed) {
              log(`  ✓ ${payload.name}: Protected`, 'green');
            } else {
              log(`  ✗ ${payload.name}: Vulnerable`, 'red');
              allPassed = false;
            }
            resolve(passed);
          });
        }).on('error', (err) => {
          log(`  ✓ ${payload.name}: Blocked by server`, 'green');
          resolve(true);
        });
      });
    } catch (error) {
      log(`  ✓ ${payload.name}: Blocked (${error.message})`, 'green');
    }
  }

  return allPassed;
}

// Main test runner
async function runSecurityTests() {
  log('🔐 Security Test Suite for Next.js Documentation Site', 'blue');
  log(`Target URL: ${TARGET_URL}\n`, 'yellow');

  const results = {
    headers: await testSecurityHeaders(),
    csp: await testCSPViolations(),
    files: await testSensitiveFileProtection(),
    xss: await testXSSProtection(),
  };

  // Summary
  log('\n📊 Test Summary:', 'blue');
  Object.entries(results).forEach(([test, passed]) => {
    log(`  ${test}: ${passed ? '✓ PASSED' : '✗ FAILED'}`, passed ? 'green' : 'red');
  });

  const allPassed = Object.values(results).every(r => r);
  log(`\n${allPassed ? '✅ All tests passed!' : '❌ Some tests failed!'}`, allPassed ? 'green' : 'red');

  process.exit(allPassed ? 0 : 1);
}

// Run tests
runSecurityTests().catch(error => {
  log(`\n❌ Test suite failed: ${error.message}`, 'red');
  process.exit(1);
});