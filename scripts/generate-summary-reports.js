#!/usr/bin/env node

/**
 * Generate Summary Reports
 * 
 * Creates detailed breakdowns by role, work type, complexity, and feature area
 */

const fs = require('fs');
const path = require('path');

function generateSummaryReports() {
  const basePath = process.cwd();
  const dataPath = path.join(basePath, 'dev-hours-inventory.json');
  
  if (!fs.existsSync(dataPath)) {
    console.error('Error: dev-hours-inventory.json not found. Run measure-dev-hours.js first.');
    process.exit(1);
  }
  
  const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
  
  // 1. By Role
  const byRole = {};
  data.forEach(file => {
    if (!byRole[file.role]) {
      byRole[file.role] = {
        count: 0,
        totalLOC: 0,
        totalHours: 0,
        totalCost: 0,
        avgComplexity: 0,
        files: []
      };
    }
    byRole[file.role].count++;
    byRole[file.role].totalLOC += file.loc;
    byRole[file.role].totalHours += file.totalHours;
    byRole[file.role].totalCost += file.cost;
    byRole[file.role].files.push(file);
  });
  
  // Calculate averages
  Object.keys(byRole).forEach(role => {
    byRole[role].avgComplexity = byRole[role].files.reduce((sum, f) => sum + f.complexityScore, 0) / byRole[role].count;
  });
  
  // 2. By Work Type
  const byWorkType = {};
  data.forEach(file => {
    const primary = file.workTypePrimary;
    if (!byWorkType[primary]) {
      byWorkType[primary] = {
        count: 0,
        totalLOC: 0,
        totalHours: 0,
        totalCost: 0,
        files: []
      };
    }
    byWorkType[primary].count++;
    byWorkType[primary].totalLOC += file.loc;
    byWorkType[primary].totalHours += file.totalHours;
    byWorkType[primary].totalCost += file.cost;
    byWorkType[primary].files.push(file);
  });
  
  // 3. By Complexity
  const byComplexity = {};
  data.forEach(file => {
    const category = file.complexityCategory;
    if (!byComplexity[category]) {
      byComplexity[category] = {
        count: 0,
        totalLOC: 0,
        totalHours: 0,
        totalCost: 0,
        files: []
      };
    }
    byComplexity[category].count++;
    byComplexity[category].totalLOC += file.loc;
    byComplexity[category].totalHours += file.totalHours;
    byComplexity[category].totalCost += file.cost;
    byComplexity[category].files.push(file);
  });
  
  // 4. By Feature Area
  const byFeatureArea = {};
  data.forEach(file => {
    const areas = file.featureAreas.split(', ').filter(a => a && a !== 'general');
    if (areas.length === 0) {
      areas.push('general');
    }
    areas.forEach(area => {
      if (!byFeatureArea[area]) {
        byFeatureArea[area] = {
          count: 0,
          totalLOC: 0,
          totalHours: 0,
          totalCost: 0,
          files: []
        };
      }
      byFeatureArea[area].count++;
      byFeatureArea[area].totalLOC += file.loc;
      byFeatureArea[area].totalHours += file.totalHours;
      byFeatureArea[area].totalCost += file.cost;
      byFeatureArea[area].files.push(file);
    });
  });
  
  // Generate CSV reports
  const reportsDir = path.join(basePath, 'dev-hours-reports');
  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
  }
  
  // Report 1: By Role
  const roleReport = [
    ['Role', 'File Count', 'Total LOC', 'Total Hours', 'Total Cost ($)', 'Avg Complexity'],
    ...Object.entries(byRole).map(([role, data]) => [
      role,
      data.count,
      data.totalLOC,
      data.totalHours.toFixed(2),
      data.totalCost.toFixed(2),
      data.avgComplexity.toFixed(2),
    ])
  ].map(row => row.join(',')).join('\n');
  
  fs.writeFileSync(path.join(reportsDir, 'summary-by-role.csv'), roleReport);
  
  // Report 2: By Work Type
  const workTypeReport = [
    ['Work Type', 'File Count', 'Total LOC', 'Total Hours', 'Total Cost ($)'],
    ...Object.entries(byWorkType).map(([type, data]) => [
      type,
      data.count,
      data.totalLOC,
      data.totalHours.toFixed(2),
      data.totalCost.toFixed(2),
    ])
  ].map(row => row.join(',')).join('\n');
  
  fs.writeFileSync(path.join(reportsDir, 'summary-by-work-type.csv'), workTypeReport);
  
  // Report 3: By Complexity
  const complexityReport = [
    ['Complexity Category', 'File Count', 'Total LOC', 'Total Hours', 'Total Cost ($)'],
    ...Object.entries(byComplexity).map(([category, data]) => [
      category,
      data.count,
      data.totalLOC,
      data.totalHours.toFixed(2),
      data.totalCost.toFixed(2),
    ])
  ].map(row => row.join(',')).join('\n');
  
  fs.writeFileSync(path.join(reportsDir, 'summary-by-complexity.csv'), complexityReport);
  
  // Report 4: By Feature Area
  const featureAreaReport = [
    ['Feature Area', 'File Count', 'Total LOC', 'Total Hours', 'Total Cost ($)'],
    ...Object.entries(byFeatureArea)
      .sort((a, b) => b[1].totalCost - a[1].totalCost)
      .map(([area, data]) => [
        area,
        data.count,
        data.totalLOC,
        data.totalHours.toFixed(2),
        data.totalCost.toFixed(2),
      ])
  ].map(row => row.join(',')).join('\n');
  
  fs.writeFileSync(path.join(reportsDir, 'summary-by-feature-area.csv'), featureAreaReport);
  
  // Generate JSON summary
  const summary = {
    totals: {
      files: data.length,
      totalLOC: data.reduce((sum, f) => sum + f.loc, 0),
      totalHours: data.reduce((sum, f) => sum + f.totalHours, 0),
      totalCost: data.reduce((sum, f) => sum + f.cost, 0),
    },
    byRole,
    byWorkType,
    byComplexity,
    byFeatureArea,
  };
  
  fs.writeFileSync(
    path.join(reportsDir, 'summary.json'),
    JSON.stringify(summary, null, 2)
  );
  
  // Print summary
  console.log('=== SUMMARY REPORTS GENERATED ===\n');
  console.log(`Reports directory: ${reportsDir}\n`);
  
  console.log('=== TOTALS ===');
  console.log(`Files: ${summary.totals.files}`);
  console.log(`LOC: ${summary.totals.totalLOC.toLocaleString()}`);
  console.log(`Hours: ${summary.totals.totalHours.toFixed(2)}`);
  console.log(`Cost: $${summary.totals.totalCost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
  
  console.log('\n=== BY ROLE ===');
  Object.entries(byRole)
    .sort((a, b) => b[1].totalCost - a[1].totalCost)
    .forEach(([role, data]) => {
      console.log(`${role}: ${data.count} files, ${data.totalHours.toFixed(2)}h, $${data.totalCost.toFixed(2)}`);
    });
  
  console.log('\n=== BY WORK TYPE ===');
  Object.entries(byWorkType)
    .sort((a, b) => b[1].totalCost - a[1].totalCost)
    .forEach(([type, data]) => {
      console.log(`${type}: ${data.count} files, ${data.totalHours.toFixed(2)}h, $${data.totalCost.toFixed(2)}`);
    });
  
  console.log('\n=== BY COMPLEXITY ===');
  Object.entries(byComplexity)
    .sort((a, b) => {
      const order = { 'Simple': 1, 'Medium': 2, 'Complex': 3, 'Very Complex': 4 };
      return (order[a[0]] || 0) - (order[b[0]] || 0);
    })
    .forEach(([category, data]) => {
      console.log(`${category}: ${data.count} files, ${data.totalHours.toFixed(2)}h, $${data.totalCost.toFixed(2)}`);
    });
  
  console.log('\n=== TOP 10 FEATURE AREAS BY COST ===');
  Object.entries(byFeatureArea)
    .sort((a, b) => b[1].totalCost - a[1].totalCost)
    .slice(0, 10)
    .forEach(([area, data]) => {
      console.log(`${area}: ${data.count} files, ${data.totalHours.toFixed(2)}h, $${data.totalCost.toFixed(2)}`);
    });
  
  console.log('\nReports generated successfully!');
}

if (require.main === module) {
  generateSummaryReports();
}

module.exports = { generateSummaryReports };

