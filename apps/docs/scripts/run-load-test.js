#!/usr/bin/env node

const { exec } = require('child_process');
const path = require('path');

const PORT = process.env.PORT || 3003;

async function runCommand(command) {
  return new Promise((resolve, reject) => {
    const process = exec(command, (error, stdout, stderr) => {
      if (error) {
        reject(error);
        return;
      }
      resolve({ stdout, stderr, process });
    });
    
    // Stream output in real-time
    process.stdout.on('data', (data) => console.log(data.toString()));
    process.stderr.on('data', (data) => console.error(data.toString()));
  });
}

async function startServer() {
  console.log(`🚀 Starting Next.js server on port ${PORT}...`);
  const serverProcess = exec(`cd ${path.join(__dirname, '..')} && PORT=${PORT} npm start`);
  
  // Wait for server to be ready
  await new Promise(resolve => setTimeout(resolve, 5000));
  
  return serverProcess;
}

async function runLoadTest() {
  let serverProcess;
  
  try {
    // Start server
    serverProcess = await startServer();
    
    console.log('🔥 Starting load test...\n');
    
    // Run Artillery load test
    const testFile = path.join(__dirname, 'load-test.yml');
    await runCommand(`npx artillery run ${testFile} --output load-test-report.json`);
    
    console.log('\n📊 Generating HTML report...');
    await runCommand('npx artillery report load-test-report.json');
    
    console.log('\n✅ Load test completed! Check load-test-report.json.html for detailed results.');
    
    // Quick summary
    console.log('\n📈 Quick Summary:');
    await runCommand('npx artillery report load-test-report.json --output load-test-summary.txt');
    
  } catch (error) {
    console.error('❌ Error during load test:', error);
    process.exit(1);
  } finally {
    // Kill server process
    if (serverProcess) {
      serverProcess.kill();
    }
  }
}

// Run the load test
runLoadTest();