// File: scripts/triage-todos.js
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Priority keywords - order matters (first match wins)
const PRIORITY_RULES = [
  { priority: 'P0-CRITICAL', patterns: [/security/i, /vulnerability/i, /exploit/i, /injection/i, /xss/i, /csrf/i, /auth.*bypass/i] },
  { priority: 'P0-CRITICAL', patterns: [/payment/i, /stripe/i, /billing/i, /charge/i, /money/i, /financial/i] },
  { priority: 'P0-CRITICAL', patterns: [/data.*loss/i, /corrupt/i, /race.*condition/i, /deadlock/i] },
  { priority: 'P1-HIGH', patterns: [/bug/i, /broken/i, /crash/i, /error/i, /fail/i, /wrong/i] },
  { priority: 'P1-HIGH', patterns: [/hack/i, /workaround/i, /temporary/i, /remove.*before/i] },
  { priority: 'P2-MEDIUM', patterns: [/todo/i, /fixme/i, /refactor/i, /cleanup/i, /optimize/i] },
  { priority: 'P2-MEDIUM', patterns: [/performance/i, /slow/i, /memory/i, /leak/i] },
  { priority: 'P3-LOW', patterns: [/nice.*to.*have/i, /someday/i, /maybe/i, /consider/i, /enhancement/i] }
];

// File priority weights (security-critical files get boosted)
const FILE_WEIGHTS = {
  'payment': 2, 'stripe': 2, 'billing': 2,
  'auth': 2, 'security': 2, 'csrf': 2,
  'api': 1.5, 'admin': 1.5
};

const extractTodos = () => {
  const output = execSync(
    `grep -rn -E "(TODO|FIXME|BUG|HACK|XXX|WARN):" --include="*.js" --include="*.ts" --include="*.tsx" --include="*.jsx" . 2>/dev/null || true`,
    { encoding: 'utf8', maxBuffer: 20 * 1024 * 1024 }
  );

  const todos = [];
  
  output.split('\n').filter(Boolean).forEach(line => {
    if (line.includes('node_modules') || line.includes('.next')) return;
    
    const parts = line.split(':');
    if (parts.length < 3) return;
    
    const file = parts[0];
    const lineNum = parts[1];
    const content = parts.slice(2).join(':').trim();
    
    // Determine priority
    let priority = 'P3-LOW';
    for (const rule of PRIORITY_RULES) {
      if (rule.patterns.some(p => p.test(content))) {
        priority = rule.priority;
        break;
      }
    }
    
    // Apply file weight boost
    const fileName = path.basename(file).toLowerCase();
    for (const [keyword, weight] of Object.entries(FILE_WEIGHTS)) {
      if (fileName.includes(keyword) || file.toLowerCase().includes(`/${keyword}`)) {
        if (priority === 'P2-MEDIUM') priority = 'P1-HIGH';
        if (priority === 'P3-LOW') priority = 'P2-MEDIUM';
        break;
      }
    }
    
    todos.push({ file, lineNum, content, priority });
  });

  return todos;
};

const generateReport = (todos) => {
  // Group by priority
  const grouped = {
    'P0-CRITICAL': [],
    'P1-HIGH': [],
    'P2-MEDIUM': [],
    'P3-LOW': []
  };
  
  todos.forEach(todo => {
    grouped[todo.priority].push(todo);
  });

  // Generate markdown report
  let report = `# Technical Debt Triage Report
Generated: ${new Date().toISOString()}

## Summary
| Priority | Count | Action Required |
|----------|-------|-----------------|
| P0-CRITICAL | ${grouped['P0-CRITICAL'].length} | Immediate - Block releases |
| P1-HIGH | ${grouped['P1-HIGH'].length} | This sprint |
| P2-MEDIUM | ${grouped['P2-MEDIUM'].length} | This quarter |
| P3-LOW | ${grouped['P3-LOW'].length} | Backlog |

**Total: ${todos.length} items**

---

`;

  for (const [priority, items] of Object.entries(grouped)) {
    report += `## ${priority} (${items.length} items)\n\n`;
    
    if (items.length === 0) {
      report += '_No items_\n\n';
      continue;
    }
    
    items.forEach((item, idx) => {
      report += `### ${idx + 1}. ${item.file}:${item.lineNum}\n`;
      report += `\`\`\`\n${item.content}\n\`\`\`\n\n`;
    });
  }

  fs.writeFileSync('TODO_TRIAGE_REPORT.md', report);
  
  // Generate CSV for import to project management
  const csv = 'Priority,File,Line,Content\n' + 
    todos.map(t => `"${t.priority}","${t.file}","${t.lineNum}","${t.content.replace(/"/g, '""')}"`).join('\n');
  fs.writeFileSync('todo-items.csv', csv);

  console.log('\n📊 TODO Triage Summary:');
  console.log(`  🔴 P0-CRITICAL: ${grouped['P0-CRITICAL'].length}`);
  console.log(`  🟠 P1-HIGH: ${grouped['P1-HIGH'].length}`);
  console.log(`  🟡 P2-MEDIUM: ${grouped['P2-MEDIUM'].length}`);
  console.log(`  🟢 P3-LOW: ${grouped['P3-LOW'].length}`);
  console.log(`\n✅ Reports generated:`);
  console.log(`  - TODO_TRIAGE_REPORT.md (human readable)`);
  console.log(`  - todo-items.csv (import to Jira/Linear/etc)`);

  return grouped['P0-CRITICAL'].length;
};

const todos = extractTodos();
const criticalCount = generateReport(todos);

if (criticalCount > 0) {
  console.log(`\n⚠️  WARNING: ${criticalCount} CRITICAL items need immediate attention!`);
  process.exit(1);
}
