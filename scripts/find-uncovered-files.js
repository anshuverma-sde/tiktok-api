const fs = require('fs');
const path = require('path');

// Check if coverage/coverage-summary.json exists
const coverageSummaryPath = path.join(__dirname, '../coverage/coverage-summary.json');
if (!fs.existsSync(coverageSummaryPath)) {
  console.error('Coverage summary not found. Run "npm run test:coverage" first.');
  process.exit(1);
}

// Read the coverage data
const coverageData = JSON.parse(fs.readFileSync(coverageSummaryPath, 'utf8'));

// Define minimum coverage thresholds
const MIN_STATEMENT_COVERAGE = 80;
const MIN_BRANCH_COVERAGE = 80;
const MIN_FUNCTION_COVERAGE = 80;

console.log('\nFiles with low coverage (ordered by priority):\n');

// Process and sort files by lowest coverage
const fileEntries = Object.entries(coverageData);
const fileStats = fileEntries
  .filter(([filePath]) => !filePath.includes('/__tests__/') && filePath !== 'total')
  .map(([filePath, data]) => {
    const relativePath = filePath.includes('/src/') 
      ? filePath.substring(filePath.indexOf('/src/') + 1) 
      : filePath;
    
    // Calculate overall coverage score based on statements, branches, and functions
    const statementCoverage = data.statements?.pct || 0;
    const branchCoverage = data.branches?.pct || 0;
    const functionCoverage = data.functions?.pct || 0;
    
    const overallScore = (
      statementCoverage * 0.4 +
      branchCoverage * 0.3 +
      functionCoverage * 0.3
    );
    
    return {
      filePath: relativePath,
      statementCoverage,
      branchCoverage,
      functionCoverage,
      overallScore,
      statementMissing: data.statements?.total - data.statements?.covered || 0,
      branchMissing: data.branches?.total - data.branches?.covered || 0,
      functionMissing: data.functions?.total - data.functions?.covered || 0,
    };
  })
  .sort((a, b) => a.overallScore - b.overallScore);

// Display the files with low coverage
fileStats.forEach(file => {
  const needsAttention = 
    file.statementCoverage < MIN_STATEMENT_COVERAGE ||
    file.branchCoverage < MIN_BRANCH_COVERAGE ||
    file.functionCoverage < MIN_FUNCTION_COVERAGE;
  
  if (needsAttention) {
    console.log(`${file.filePath}`);
    console.log(`  Statements: ${file.statementCoverage.toFixed(1)}% (missing ${file.statementMissing})`);
    console.log(`  Branches:   ${file.branchCoverage.toFixed(1)}% (missing ${file.branchMissing})`);
    console.log(`  Functions:  ${file.functionCoverage.toFixed(1)}% (missing ${file.functionMissing})`);
    console.log('');
  }
});

// Show total coverage
const total = coverageData.total;
console.log('Overall coverage:');
console.log(`  Statements: ${total.statements.pct.toFixed(1)}%`);
console.log(`  Branches:   ${total.branches.pct.toFixed(1)}%`);
console.log(`  Functions:  ${total.functions.pct.toFixed(1)}%`);
console.log(`  Lines:      ${total.lines.pct.toFixed(1)}%`);

// Provide advice
console.log('\nNext steps:');
console.log('1. Focus on files with the lowest coverage percentages');
console.log('2. Add tests for uncovered functions and branches');
console.log('3. Run "npm run test:coverage" again to see your progress');
console.log('4. Aim for at least 80% coverage in all categories\n'); 