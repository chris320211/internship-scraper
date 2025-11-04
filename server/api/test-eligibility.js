import { extractEligibility } from './eligibilityExtractor.js';

const currentYear = new Date().getFullYear();
const currentMonth = new Date().getMonth();
const academicYear = currentMonth >= 8 ? currentYear : currentYear - 1;

console.log('=== Testing Eligibility Extraction ===');
console.log('Current year:', currentYear);
console.log('Current month:', currentMonth);
console.log('Academic year:', academicYear);
console.log('');

const tests = [
  { title: 'Graduating in 2026', expected: 'Senior' },
  { title: 'Graduating in 2027', expected: 'Junior' },
  { title: 'Class of 2026', expected: 'Senior' },
  { title: 'Class of 2027', expected: 'Junior' },
];

tests.forEach(test => {
  const result = extractEligibility(test.title, '');
  const yearsUntilGrad = parseInt(test.title.match(/202\d/)[0]) - academicYear;
  console.log(`Title: "${test.title}"`);
  console.log(`  Years until grad: ${yearsUntilGrad}`);
  console.log(`  Expected: ${test.expected}`);
  console.log(`  Result: ${result.eligible_years.join(', ')}`);
  console.log(`  ✓ ${result.eligible_years.includes(test.expected) ? 'PASS' : 'FAIL'}`);
  console.log('');
});
