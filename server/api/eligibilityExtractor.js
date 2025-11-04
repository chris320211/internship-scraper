/**
 * Enhanced Eligibility Extractor
 * Extracts graduation years and eligible class years from job descriptions
 */

/**
 * Extract graduation years from text
 * Looks for patterns like:
 * - "graduating in 2025", "2026 graduate", "class of 2027"
 * - "December 2025 - June 2027", "2025/2026/2027"
 * - "graduating by 2026"
 */
export function extractGraduationYears(text) {
  if (!text) return [];

  const lowerText = text.toLowerCase();
  const graduationYears = new Set();

  // Pattern 1: "graduating in 2025", "graduate in 2026", "graduation date of 2027"
  const graduatingInPattern = /graduat(?:ing|e|ion)(?:\s+(?:in|by|date|class))?\s+(?:of\s+)?(?:in\s+)?(\d{4})/gi;
  let match;
  while ((match = graduatingInPattern.exec(lowerText)) !== null) {
    const year = parseInt(match[1]);
    if (year >= 2024 && year <= 2030) {
      graduationYears.add(year);
    }
  }

  // Pattern 2: "class of 2025", "class of '26"
  const classOfPattern = /class\s+of\s+['"]?(\d{2,4})/gi;
  while ((match = classOfPattern.exec(lowerText)) !== null) {
    let year = parseInt(match[1]);
    if (year < 100) {
      year += 2000; // Convert '25 to 2025
    }
    if (year >= 2024 && year <= 2030) {
      graduationYears.add(year);
    }
  }

  // Pattern 3: Date ranges "December 2025 - June 2027"
  const dateRangePattern = /(?:december|january|june|may)\s+(\d{4})\s*[-–]\s*(?:december|january|june|may)\s+(\d{4})/gi;
  while ((match = dateRangePattern.exec(lowerText)) !== null) {
    const year1 = parseInt(match[1]);
    const year2 = parseInt(match[2]);
    if (year1 >= 2024 && year1 <= 2030) graduationYears.add(year1);
    if (year2 >= 2024 && year2 <= 2030) graduationYears.add(year2);
  }

  // Pattern 4: "2025/2026/2027" or "2025, 2026, or 2027"
  const yearListPattern = /\b(202[4-9]|2030)(?:\s*[/,]\s*(202[4-9]|2030))+/g;
  while ((match = yearListPattern.exec(lowerText)) !== null) {
    const yearsText = match[0];
    const years = yearsText.match(/202[4-9]|2030/g);
    years?.forEach(year => graduationYears.add(parseInt(year)));
  }

  // Pattern 5: "graduating between 2025 and 2027"
  const betweenPattern = /graduat(?:ing|e)\s+between\s+(\d{4})\s+and\s+(\d{4})/gi;
  while ((match = betweenPattern.exec(lowerText)) !== null) {
    const startYear = parseInt(match[1]);
    const endYear = parseInt(match[2]);
    if (startYear >= 2024 && endYear <= 2030) {
      for (let year = startYear; year <= endYear; year++) {
        graduationYears.add(year);
      }
    }
  }

  // Pattern 6: Just year mentions near graduation keywords (within 10 words)
  const graduationContext = /graduat(?:ing|e|ion)[^.]{0,100}(202[4-9]|2030)/gi;
  while ((match = graduationContext.exec(lowerText)) !== null) {
    const year = parseInt(match[1]);
    if (year >= 2024 && year <= 2030) {
      graduationYears.add(year);
    }
  }

  return Array.from(graduationYears).sort();
}

/**
 * Determine eligible class years from job title/description
 * Returns: ['Freshman', 'Sophomore', 'Junior', 'Senior', 'Graduate']
 */
export function extractEligibleYears(text) {
  if (!text) return [];

  const lowerText = text.toLowerCase();
  const years = [];

  // Explicit mentions
  if (lowerText.includes('freshman') || lowerText.includes('freshmen') || lowerText.includes('first year') || lowerText.includes('1st year')) {
    years.push('Freshman');
  }
  if (lowerText.includes('sophomore') || lowerText.includes('second year') || lowerText.includes('2nd year')) {
    years.push('Sophomore');
  }
  if (lowerText.includes('junior') || lowerText.includes('third year') || lowerText.includes('3rd year')) {
    years.push('Junior');
  }
  if (lowerText.includes('senior') || lowerText.includes('fourth year') || lowerText.includes('4th year')) {
    years.push('Senior');
  }
  if (lowerText.includes('graduate') || lowerText.includes('grad student') || lowerText.includes('masters') ||
      lowerText.includes("master's") || lowerText.includes('phd') || lowerText.includes('doctoral')) {
    years.push('Graduate');
  }

  // Convert graduation years to class years
  const graduationYears = extractGraduationYears(text);
  if (graduationYears.length > 0) {
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth(); // 0 = January

    // Assume academic year starts in September (month 8)
    const academicYear = currentMonth >= 8 ? currentYear : currentYear - 1;

    graduationYears.forEach(gradYear => {
      const yearsUntilGrad = gradYear - academicYear;

      // Map graduation year to class standing
      if (yearsUntilGrad === 1) {
        if (!years.includes('Senior')) years.push('Senior');
      } else if (yearsUntilGrad === 2) {
        if (!years.includes('Junior')) years.push('Junior');
      } else if (yearsUntilGrad === 3) {
        if (!years.includes('Sophomore')) years.push('Sophomore');
      } else if (yearsUntilGrad === 4) {
        if (!years.includes('Freshman')) years.push('Freshman');
      } else if (yearsUntilGrad <= 0) {
        if (!years.includes('Graduate')) years.push('Graduate');
      }
    });
  }

  // If no specific year mentioned, assume it's open to most students
  if (years.length === 0) {
    return ['Sophomore', 'Junior', 'Senior', 'Graduate'];
  }

  return years;
}

/**
 * Extract student status from job description
 * Returns: 'student', 'new_grad', 'experienced', 'any'
 */
export function extractStudentStatus(text) {
  if (!text) return 'any';

  const lowerText = text.toLowerCase();

  // Check for explicit new grad patterns
  const newGradPatterns = [
    /new grad/,
    /recent grad/,
    /early career/,
    /entry level/,
    /entry-level/,
    /college grad/,
    /university grad/,
    /newly graduated/,
  ];

  if (newGradPatterns.some(pattern => pattern.test(lowerText))) {
    return 'new_grad';
  }

  // Check for current student patterns (internship context)
  const studentPatterns = [
    /current(?:ly)?\s+(?:enrolled|pursuing)/,
    /enrolled in/,
    /pursuing.*degree/,
    /intern/,
    /co-op/,
    /student/,
    /undergraduate/,
  ];

  if (studentPatterns.some(pattern => pattern.test(lowerText))) {
    return 'student';
  }

  // Check for experienced/professional patterns
  const experiencedPatterns = [
    /\d+\+?\s*years?\s+(?:of\s+)?experience/,
    /experienced/,
    /senior/,
    /professional/,
    /mid-level/,
    /mid level/,
  ];

  if (experiencedPatterns.some(pattern => pattern.test(lowerText))) {
    return 'experienced';
  }

  return 'any';
}

/**
 * Extract visa/sponsorship requirements from job description
 * Returns: 'us_only', 'sponsorship_available', 'sponsorship_not_available', 'unknown'
 */
export function extractVisaRequirements(text) {
  if (!text) return 'unknown';

  const lowerText = text.toLowerCase();

  // US citizens/permanent residents only
  const usOnlyPatterns = [
    /must be.*(?:us citizen|u\.s\. citizen|united states citizen)/,
    /(?:us citizen|u\.s\. citizen).*required/,
    /(?:us|u\.s\.).*(?:permanent resident|green card)/,
    /authorization to work in the (?:us|u\.s\.|united states).*required/,
    /no (?:visa )?sponsorship/,
    /(?:unable|not able) to (?:provide|offer|sponsor).*(?:visa|sponsorship)/,
    /will not sponsor/,
    /cannot sponsor/,
  ];

  if (usOnlyPatterns.some(pattern => pattern.test(lowerText))) {
    // Double check it's not saying they DO sponsor
    if (!lowerText.includes('will sponsor') && !lowerText.includes('can sponsor')) {
      return 'us_only';
    }
  }

  // Sponsorship available
  const sponsorshipAvailablePatterns = [
    /(?:visa )?sponsorship.*available/,
    /(?:will|can) (?:provide|offer|sponsor).*(?:visa|sponsorship)/,
    /eligible for.*visa sponsorship/,
    /h-1b.*(?:available|sponsor)/,
    /work authorization.*(?:provided|available)/,
  ];

  if (sponsorshipAvailablePatterns.some(pattern => pattern.test(lowerText))) {
    return 'sponsorship_available';
  }

  // Explicitly no sponsorship
  if (usOnlyPatterns.some(pattern => pattern.test(lowerText))) {
    return 'sponsorship_not_available';
  }

  return 'unknown';
}

/**
 * Extract degree level requirements from job description
 * Returns: array of ['bachelors', 'masters', 'phd'] or ['any']
 */
export function extractDegreeLevel(text) {
  if (!text) return ['any'];

  const lowerText = text.toLowerCase();
  const degrees = [];

  // Bachelor's degree patterns
  if (/bachelor|undergraduate|bsc|b\.s\.|bs degree|4-year degree/i.test(lowerText)) {
    degrees.push('bachelors');
  }

  // Master's degree patterns
  if (/master|msc|m\.s\.|ms degree|graduate degree/i.test(lowerText)) {
    degrees.push('masters');
  }

  // PhD patterns
  if (/phd|ph\.d\.|doctorate|doctoral/i.test(lowerText)) {
    degrees.push('phd');
  }

  // If no specific degree mentioned, assume any degree level
  if (degrees.length === 0) {
    return ['any'];
  }

  return degrees;
}

/**
 * Extract major/field requirements from job description
 * Returns: array of majors or ['any']
 */
export function extractMajorRequirements(text) {
  if (!text) return ['any'];

  const lowerText = text.toLowerCase();
  const majors = [];

  const majorPatterns = [
    { name: 'Computer Science', patterns: [/computer science/i, /\bcs\b/i, /computing/i] },
    { name: 'Software Engineering', patterns: [/software engineering/i] },
    { name: 'Electrical Engineering', patterns: [/electrical engineering/i, /\bee\b/i] },
    { name: 'Computer Engineering', patterns: [/computer engineering/i, /\bce\b/i] },
    { name: 'Engineering', patterns: [/engineering/i, /\beng\b/i] },
    { name: 'Information Systems', patterns: [/information systems/i, /\bis\b/i, /management information systems/i, /\bmis\b/i] },
    { name: 'Information Technology', patterns: [/information technology/i, /\bit\b/i] },
    { name: 'Mathematics', patterns: [/mathematics/i, /math/i, /applied math/i] },
    { name: 'Statistics', patterns: [/statistics/i, /\bstats\b/i] },
    { name: 'Data Science', patterns: [/data science/i] },
    { name: 'Physics', patterns: [/physics/i] },
    { name: 'Business', patterns: [/business/i, /commerce/i, /management/i] },
    { name: 'Finance', patterns: [/finance/i, /financial/i, /economics/i] },
    { name: 'Accounting', patterns: [/accounting/i] },
    { name: 'Marketing', patterns: [/marketing/i] },
    { name: 'Design', patterns: [/design/i, /graphic design/i, /visual design/i] },
  ];

  majorPatterns.forEach(({ name, patterns }) => {
    if (patterns.some(pattern => pattern.test(lowerText))) {
      majors.push(name);
    }
  });

  // If no specific major mentioned, assume any major
  if (majors.length === 0) {
    return ['any'];
  }

  return majors;
}

/**
 * Main function to extract all eligibility information
 * Returns: {
 *   eligible_years: [],
 *   student_status: string,
 *   visa_requirements: string,
 *   degree_level: [],
 *   major_requirements: []
 * }
 */
export function extractEligibility(title, description) {
  const combinedText = `${title || ''} ${description || ''}`;

  return {
    eligible_years: extractEligibleYears(combinedText),
    student_status: extractStudentStatus(combinedText),
    visa_requirements: extractVisaRequirements(combinedText),
    degree_level: extractDegreeLevel(combinedText),
    major_requirements: extractMajorRequirements(combinedText),
  };
}
