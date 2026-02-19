#!/usr/bin/env node

/**
 * Lighthouse Accessibility Audit Script
 * 
 * Runs Lighthouse accessibility audits on key pages and documents baseline scores.
 * This is part of Phase 1: Stop the Bleeding from CODE_REVIEW_HANDOFF_REFINED.md
 * 
 * Usage:
 *   node scripts/lighthouse-audit.js [--url <url>] [--output <file>]
 * 
 * Default behavior: Audits 5 key pages and saves results to lighthouse-audit-results.json
 */

const fs = require('fs');
const path = require('path');

// Key pages to audit (Phase 1 requirement)
const KEY_PAGES = [
  {
    name: 'Homepage',
    url: 'http://localhost:3000',
    description: 'Main landing page',
  },
  {
    name: 'Signup',
    url: 'http://localhost:3000/signup',
    description: 'User registration page',
  },
  {
    name: 'Draft Room',
    url: 'http://localhost:3000/draft',
    description: 'Main draft room (vx2)',
  },
  {
    name: 'Payment',
    url: 'http://localhost:3000/payment',
    description: 'Payment processing page',
  },
  {
    name: 'Profile',
    url: 'http://localhost:3000/profile',
    description: 'User profile page',
  },
];

/**
 * Check if Lighthouse CLI is available
 */
function checkLighthouseAvailable() {
  try {
    require.resolve('lighthouse');
    return true;
  } catch (e) {
    return false;
  }
}

/**
 * Run Lighthouse audit on a single URL
 */
async function runLighthouseAudit(url, name) {
  const lighthouse = require('lighthouse');
  const chromeLauncher = require('chrome-launcher');
  
  console.log(`\n🔍 Auditing ${name}...`);
  console.log(`   URL: ${url}`);
  
  // Launch Chrome
  const chrome = await chromeLauncher.launch({
    chromeFlags: ['--headless', '--no-sandbox'],
  });
  
  const options = {
    logLevel: 'info',
    output: 'json',
    onlyCategories: ['accessibility'],
    port: chrome.port,
  };
  
  try {
    const runnerResult = await lighthouse(url, options);
    await chrome.kill();
    
    const accessibilityScore = runnerResult.lhr.categories.accessibility.score * 100;
    const audits = runnerResult.lhr.audits;
    
    // Extract top issues
    const issues = Object.values(audits)
      .filter(audit => audit.score !== null && audit.score < 1)
      .map(audit => ({
        id: audit.id,
        title: audit.title,
        description: audit.description,
        score: audit.score,
        severity: audit.score < 0.5 ? 'critical' : audit.score < 0.75 ? 'high' : 'medium',
      }))
      .sort((a, b) => a.score - b.score)
      .slice(0, 10); // Top 10 issues
    
    return {
      name,
      url,
      score: Math.round(accessibilityScore),
      issues,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    await chrome.kill();
    throw error;
  }
}

/**
 * Main audit function
 */
async function runAudits() {
  console.log('🚀 Starting Lighthouse Accessibility Audit');
  console.log('=' .repeat(60));
  
  // Check if Lighthouse is available
  if (!checkLighthouseAvailable()) {
    console.error('\n❌ ERROR: Lighthouse not found.');
    console.error('   Install with: npm install --save-dev lighthouse chrome-launcher');
    console.error('   Or run: npm install\n');
    process.exit(1);
  }
  
  const results = {
    timestamp: new Date().toISOString(),
    pages: [],
    summary: {
      totalPages: KEY_PAGES.length,
      averageScore: 0,
      criticalIssues: 0,
      highIssues: 0,
      mediumIssues: 0,
    },
  };
  
  // Run audits
  for (const page of KEY_PAGES) {
    try {
      const result = await runLighthouseAudit(page.url, page.name);
      results.pages.push(result);
      
      // Update summary
      results.summary.criticalIssues += result.issues.filter(i => i.severity === 'critical').length;
      results.summary.highIssues += result.issues.filter(i => i.severity === 'high').length;
      results.summary.mediumIssues += result.issues.filter(i => i.severity === 'medium').length;
    } catch (error) {
      console.error(`\n❌ Failed to audit ${page.name}:`, error.message);
      results.pages.push({
        name: page.name,
        url: page.url,
        error: error.message,
        timestamp: new Date().toISOString(),
      });
    }
  }
  
  // Calculate average score
  const scoredPages = results.pages.filter(p => p.score !== undefined);
  if (scoredPages.length > 0) {
    results.summary.averageScore = Math.round(
      scoredPages.reduce((sum, p) => sum + p.score, 0) / scoredPages.length
    );
  }
  
  // Save results
  const outputPath = path.join(process.cwd(), 'lighthouse-audit-results.json');
  fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
  
  // Print summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 AUDIT SUMMARY');
  console.log('='.repeat(60));
  console.log(`\nAverage Accessibility Score: ${results.summary.averageScore}/100`);
  console.log(`\nIssues Found:`);
  console.log(`  Critical: ${results.summary.criticalIssues}`);
  console.log(`  High: ${results.summary.highIssues}`);
  console.log(`  Medium: ${results.summary.mediumIssues}`);
  
  console.log(`\n📄 Detailed Results:`);
  results.pages.forEach(page => {
    if (page.error) {
      console.log(`  ❌ ${page.name}: ERROR - ${page.error}`);
    } else {
      console.log(`  ${page.score >= 90 ? '✅' : page.score >= 70 ? '⚠️' : '❌'} ${page.name}: ${page.score}/100`);
      if (page.issues.length > 0) {
        const critical = page.issues.filter(i => i.severity === 'critical');
        if (critical.length > 0) {
          console.log(`     Critical issues: ${critical.length}`);
          critical.slice(0, 3).forEach(issue => {
            console.log(`       - ${issue.title}`);
          });
        }
      }
    }
  });
  
  console.log(`\n📁 Full results saved to: ${outputPath}`);
  console.log('\n💡 Next Steps:');
  console.log('   1. Review critical issues and fix P0 blockers');
  console.log('   2. Focus on keyboard navigation and screen reader support');
  console.log('   3. Re-run audit after fixes to track improvement');
  console.log('   4. See CODE_REVIEW_HANDOFF_REFINED.md Phase 1 for details\n');
  
  // Exit with error if average score is below 70
  if (results.summary.averageScore < 70) {
    console.log('⚠️  WARNING: Average accessibility score is below 70');
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  runAudits().catch(error => {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  });
}

module.exports = { runAudits, KEY_PAGES };
