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
 * Main function to extract all eligibility information
 * Returns: { eligible_years: [], graduation_years: [] }
 */
export function extractEligibility(title, description) {
  const combinedText = `${title || ''} ${description || ''}`;

  return {
    eligible_years: extractEligibleYears(combinedText),
    graduation_years: extractGraduationYears(combinedText)
  };
}
