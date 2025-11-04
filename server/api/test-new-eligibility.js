import { extractEligibility } from './eligibilityExtractor.js';

console.log('=== Testing Enhanced Eligibility Extraction ===\n');

const tests = [
  {
    name: 'Software Engineering Internship',
    title: 'Software Engineering Intern - Summer 2026',
    description: 'Looking for current students pursuing a Bachelor\'s degree in Computer Science or related field. Graduating in 2026 or 2027. Must be authorized to work in the US. No visa sponsorship available.',
    expected: {
      eligible_years: ['Junior', 'Senior'],
      student_status: 'student',
      visa_requirements: 'sponsorship_not_available',
      degree_level: ['bachelors'],
      major_requirements: ['Computer Science']
    }
  },
  {
    name: 'Investment Banking Analyst - New Grad',
    title: 'Investment Banking Analyst',
    description: 'New grad position for recent graduates with Finance or Business degree. We will sponsor H-1B visas.',
    expected: {
      student_status: 'new_grad',
      visa_requirements: 'sponsorship_available',
      major_requirements: ['Finance', 'Business']
    }
  },
  {
    name: 'Machine Learning Intern - MS/PhD',
    title: 'Machine Learning Research Intern',
    description: 'Looking for graduate students pursuing Master\'s or PhD in Computer Science, focusing on machine learning.',
    expected: {
      eligible_years: ['Graduate'],
      student_status: 'student',
      degree_level: ['masters', 'phd'],
      major_requirements: ['Computer Science']
    }
  },
  {
    name: 'Marketing Intern',
    title: 'Marketing Intern - Summer 2026',
    description: 'Seeking undergraduate students in Marketing or Business majors for summer internship.',
    expected: {
      student_status: 'student',
      degree_level: ['bachelors'],
      major_requirements: ['Marketing', 'Business']
    }
  }
];

tests.forEach((test, index) => {
  console.log(`\nTest ${index + 1}: ${test.name}`);
  console.log(`Title: "${test.title}"`);
  console.log(`Description: "${test.description.substring(0, 100)}..."`);

  const result = extractEligibility(test.title, test.description);

  console.log('\nExtracted Data:');
  console.log(`  Eligible Years: ${result.eligible_years.join(', ')}`);
  console.log(`  Student Status: ${result.student_status}`);
  console.log(`  Visa Requirements: ${result.visa_requirements}`);
  console.log(`  Degree Level: ${result.degree_level.join(', ')}`);
  console.log(`  Major Requirements: ${result.major_requirements.join(', ')}`);

  // Validation
  let passed = true;
  if (test.expected.eligible_years) {
    const hasAllYears = test.expected.eligible_years.every(year => result.eligible_years.includes(year));
    if (!hasAllYears) {
      console.log(`  ❌ FAIL: Expected years ${test.expected.eligible_years.join(', ')}, got ${result.eligible_years.join(', ')}`);
      passed = false;
    }
  }

  if (test.expected.student_status && result.student_status !== test.expected.student_status) {
    console.log(`  ❌ FAIL: Expected student_status ${test.expected.student_status}, got ${result.student_status}`);
    passed = false;
  }

  if (test.expected.visa_requirements && result.visa_requirements !== test.expected.visa_requirements) {
    console.log(`  ❌ FAIL: Expected visa_requirements ${test.expected.visa_requirements}, got ${result.visa_requirements}`);
    passed = false;
  }

  if (test.expected.degree_level) {
    const hasAllDegrees = test.expected.degree_level.every(deg => result.degree_level.includes(deg));
    if (!hasAllDegrees) {
      console.log(`  ❌ FAIL: Expected degree_level ${test.expected.degree_level.join(', ')}, got ${result.degree_level.join(', ')}`);
      passed = false;
    }
  }

  if (test.expected.major_requirements) {
    const hasAllMajors = test.expected.major_requirements.every(maj => result.major_requirements.includes(maj));
    if (!hasAllMajors) {
      console.log(`  ❌ FAIL: Expected major_requirements ${test.expected.major_requirements.join(', ')}, got ${result.major_requirements.join(', ')}`);
      passed = false;
    }
  }

  if (passed) {
    console.log('  ✅ PASS');
  }

  console.log('---');
});

console.log('\n=== Testing Job Type Categorization ===\n');

import { categorizeJobType } from './jobTypeClassifier.js';

const jobTypeTests = [
  { title: 'Software Engineering Intern', expected: 'Software Engineering' },
  { title: 'Investment Banking Analyst', expected: 'Investment Banking' },
  { title: 'Machine Learning Intern', expected: 'Machine Learning' },
  { title: 'Marketing Intern', expected: 'Marketing' },
  { title: 'Finance Analyst', expected: 'Finance' },
  { title: 'Accounting Intern', expected: 'Accounting' },
  { title: 'Consulting Associate', expected: 'Consulting' },
  { title: 'Data Science Intern', expected: 'Data Science' },
  { title: 'Hardware Engineer', expected: 'Hardware Engineering' },
];

jobTypeTests.forEach((test, index) => {
  const result = categorizeJobType(test.title, '');
  const passed = result === test.expected;
  console.log(`${index + 1}. "${test.title}" → ${result} ${passed ? '✅' : '❌ Expected: ' + test.expected}`);
});

console.log('\n=== All Tests Complete ===\n');
