const JOB_TYPE_PATTERNS = [
  {
    label: 'Machine Learning',
    patterns: [
      /machine learning/,
      /\bml\b/,
      /deep learning/,
      /artificial intelligence/,
      /computer vision/,
      /natural language processing/,
      /\bnlp\b/,
      /reinforcement learning/,
    ],
  },
  {
    label: 'Data Science',
    patterns: [
      /data science/,
      /data scientist/,
      /data analytics/,
      /data analyst/,
      /business intelligence/,
      /decision science/,
      /insights analyst/,
    ],
  },
  {
    label: 'Data Engineering',
    patterns: [
      /data engineer/,
      /analytics engineer/,
      /data platform/,
      /data infrastructure/,
      /data pipeline/,
    ],
  },
  {
    label: 'Quantitative Finance',
    patterns: [
      /quantitative analyst/,
      /quantitative researcher/,
      /quantitative trading/,
      /\bquant\b/,
      /algorithmic trading/,
      /trading analyst/,
      /derivatives/,
      /hedge fund/,
    ],
  },
  {
    label: 'Research',
    patterns: [
      /research scientist/,
      /research engineer/,
      /research intern/,
      /r&d/,
      /research and development/,
      /applied research/,
    ],
  },
  {
    label: 'Full Stack Development',
    patterns: [/full[-\s]?stack/, /fullstack/],
  },
  {
    label: 'Frontend Development',
    patterns: [
      /front[-\s]?end/,
      /frontend/,
      /web developer/,
      /web engineer/,
      /javascript developer/,
      /react developer/,
      /ui engineer/,
    ],
  },
  {
    label: 'Backend Development',
    patterns: [
      /back[-\s]?end/,
      /backend/,
      /server developer/,
      /api developer/,
      /distributed systems/,
      /platform engineer/,
    ],
  },
  {
    label: 'Software Engineering',
    patterns: [
      /software engineer/,
      /software developer/,
      /\bswe\b/,
      /software development/,
      /application engineer/,
    ],
  },
  {
    label: 'Mobile Development',
    patterns: [
      /mobile/,
      /ios/,
      /android/,
      /swift/,
      /kotlin/,
      /react native/,
      /flutter/,
    ],
  },
  {
    label: 'Security Engineering',
    patterns: [
      /security engineer/,
      /cybersecurity/,
      /information security/,
      /application security/,
      /appsec/,
      /offensive security/,
      /threat detection/,
    ],
  },
  {
    label: 'DevOps',
    patterns: [
      /devops/,
      /site reliability/,
      /\bsre\b/,
      /infrastructure engineer/,
      /cloud engineer/,
      /platform reliability/,
      /build engineer/,
      /release engineer/,
    ],
  },
  {
    label: 'Quality Assurance',
    patterns: [
      /\bqa\b/,
      /quality assurance/,
      /test engineer/,
      /testing engineer/,
      /automation engineer/,
      /validation engineer/,
    ],
  },
  {
    label: 'Hardware Engineering',
    patterns: [
      /hardware engineer/,
      /electrical engineer/,
      /electronics engineer/,
      /asic/,
      /fpga/,
      /semiconductor/,
      /chip design/,
      /pcb/,
    ],
  },
  {
    label: 'Embedded Systems',
    patterns: [
      /embedded engineer/,
      /embedded systems/,
      /firmware/,
      /\biot\b/,
      /real-time systems/,
      /rtos/,
    ],
  },
  {
    label: 'Robotics',
    patterns: [
      /robotics/,
      /robotic engineer/,
      /autonomy engineer/,
      /autonomous systems/,
      /mechatronics/,
    ],
  },
  {
    label: 'Product Management',
    patterns: [
      /product manager/,
      /product management/,
      /product strategy/,
    ],
  },
  {
    label: 'UI/UX Design',
    patterns: [
      /user experience/,
      /user interface/,
      /ux designer/,
      /ui designer/,
      /product designer/,
      /interaction designer/,
      /experience design/,
    ],
  },
];

function matchesPattern(text, pattern) {
  if (pattern instanceof RegExp) {
    return pattern.test(text);
  }
  return text.includes(pattern);
}

export function categorizeJobType(title, description = '') {
  const text = `${title ?? ''} ${description ?? ''}`.toLowerCase();

  for (const category of JOB_TYPE_PATTERNS) {
    if (category.patterns.some((pattern) => matchesPattern(text, pattern))) {
      return category.label;
    }
  }

  return 'Other';
}

export const KNOWN_JOB_TYPES = JOB_TYPE_PATTERNS.map((pattern) => pattern.label);
