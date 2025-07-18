#!/usr/bin/env node

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3003;
const PAGES = [
  '/',
  '/docs/getting-started',
  '/docs/installation',
  '/docs/api-reference',
  '/api-docs/globals'
];

const LIGHTHOUSE_FLAGS = [
  '--chrome-flags="--headless"',
  '--output=json',
  '--output=html'
];

const BUDGET = {
  performance: 95,
  accessibility: 95,
  'best-practices': 95,
  seo: 95,
  pwa: 90
};

async function runCommand(command) {
  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (error) {
        reject(error);
        return;
      }
      resolve(stdout);
    });
  });
}

async function startServer() {
  console.log(`🚀 Starting Next.js server on port ${PORT}...`);
  const serverProcess = exec(`cd ${path.join(__dirname, '..')} && PORT=${PORT} npm start`);
  
  // Wait for server to be ready
  await new Promise(resolve => setTimeout(resolve, 5000));
  
  return serverProcess;
}

async function runLighthouseAudit(url, pageName) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const reportPath = path.join(__dirname, '..', 'lighthouse-reports');
  
  // Create reports directory if it doesn't exist
  if (!fs.existsSync(reportPath)) {
    fs.mkdirSync(reportPath, { recursive: true });
  }
  
  const outputPath = path.join(reportPath, `${pageName}-${timestamp}`);
  
  console.log(`🔍 Running Lighthouse audit for ${url}...`);
  
  try {
    const command = `npx lighthouse ${url} ${LIGHTHOUSE_FLAGS.join(' ')} --output-path="${outputPath}"`;
    await runCommand(command);
    
    // Read JSON report
    const jsonReport = JSON.parse(fs.readFileSync(`${outputPath}.report.json`, 'utf8'));
    const scores = {
      performance: Math.round(jsonReport.categories.performance.score * 100),
      accessibility: Math.round(jsonReport.categories.accessibility.score * 100),
      'best-practices': Math.round(jsonReport.categories['best-practices'].score * 100),
      seo: Math.round(jsonReport.categories.seo.score * 100),
      pwa: jsonReport.categories.pwa ? Math.round(jsonReport.categories.pwa.score * 100) : null
    };
    
    // Core Web Vitals
    const metrics = {
      FCP: jsonReport.audits['first-contentful-paint'].numericValue,
      LCP: jsonReport.audits['largest-contentful-paint'].numericValue,
      TBT: jsonReport.audits['total-blocking-time'].numericValue,
      CLS: jsonReport.audits['cumulative-layout-shift'].numericValue,
      SI: jsonReport.audits['speed-index'].numericValue
    };
    
    return { scores, metrics, reportPath: `${outputPath}.report.html` };
  } catch (error) {
    console.error(`❌ Error running Lighthouse for ${url}:`, error);
    return null;
  }
}

async function runAllAudits() {
  let serverProcess;
  
  try {
    // Start server
    serverProcess = await startServer();
    
    const results = [];
    
    // Run audits for all pages
    for (const page of PAGES) {
      const url = `http://localhost:${PORT}${page}`;
      const pageName = page === '/' ? 'home' : page.replace(/\//g, '-').slice(1);
      
      const result = await runLighthouseAudit(url, pageName);
      if (result) {
        results.push({ page, ...result });
      }
    }
    
    // Generate summary report
    console.log('\n📊 Lighthouse Audit Summary\n');
    console.log('Page | Performance | Accessibility | Best Practices | SEO | PWA');
    console.log('-----|-------------|---------------|----------------|-----|-----');
    
    let allPassed = true;
    
    for (const result of results) {
      const scores = result.scores;
      const row = [
        result.page.padEnd(20),
        `${scores.performance}`.padEnd(11),
        `${scores.accessibility}`.padEnd(13),
        `${scores['best-practices']}`.padEnd(14),
        `${scores.seo}`.padEnd(3),
        scores.pwa ? `${scores.pwa}` : 'N/A'
      ];
      
      console.log(row.join(' | '));
      
      // Check if meets budget
      for (const [category, score] of Object.entries(scores)) {
        if (score !== null && score < BUDGET[category]) {
          allPassed = false;
          console.log(`⚠️  ${result.page} - ${category}: ${score} (target: ${BUDGET[category]})`);
        }
      }
    }
    
    console.log('\n📈 Core Web Vitals Summary\n');
    console.log('Page | FCP (ms) | LCP (ms) | TBT (ms) | CLS | SI (ms)');
    console.log('-----|----------|----------|----------|-----|--------');
    
    for (const result of results) {
      const metrics = result.metrics;
      const row = [
        result.page.padEnd(20),
        `${Math.round(metrics.FCP)}`.padEnd(8),
        `${Math.round(metrics.LCP)}`.padEnd(8),
        `${Math.round(metrics.TBT)}`.padEnd(8),
        `${metrics.CLS.toFixed(3)}`.padEnd(3),
        `${Math.round(metrics.SI)}`
      ];
      
      console.log(row.join(' | '));
    }
    
    console.log('\n📝 Detailed reports saved to: lighthouse-reports/');
    
    if (allPassed) {
      console.log('\n✅ All pages meet performance targets!');
    } else {
      console.log('\n❌ Some pages need performance improvements.');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('Error during audit:', error);
    process.exit(1);
  } finally {
    // Kill server process
    if (serverProcess) {
      serverProcess.kill();
    }
  }
}

// Run audits
runAllAudits();