# AI-Powered Job Description Categorization - Implementation Plan

## Overview
Implement an AI service that analyzes job descriptions and automatically categorizes internships with detailed metadata including eligibility requirements, required skills, languages, and other qualifications.

---

## Phase 1: Database Schema Updates

### 1.1 Add AI Analysis Fields to Database

Update the `internships` table in `server/database/schema.sql`:

```sql
-- Add AI-extracted fields to internships table
ALTER TABLE internships ADD COLUMN IF NOT EXISTS
  description TEXT; -- Full job description

ALTER TABLE internships ADD COLUMN IF NOT EXISTS
  requirements TEXT[]; -- Array of requirements extracted by AI

ALTER TABLE internships ADD COLUMN IF NOT EXISTS
  required_languages TEXT[]; -- Programming languages (e.g., ['Python', 'JavaScript', 'Java'])

ALTER TABLE internships ADD COLUMN IF NOT EXISTS
  required_skills TEXT[]; -- Technical skills (e.g., ['React', 'Machine Learning', 'SQL'])

ALTER TABLE internships ADD COLUMN IF NOT EXISTS
  pay_range TEXT; -- Salary/hourly range

ALTER TABLE internships ADD COLUMN IF NOT EXISTS
  duration TEXT; -- Internship duration (e.g., '10 weeks', '3 months')

ALTER TABLE internships ADD COLUMN IF NOT EXISTS
  min_gpa DECIMAL(3,2); -- Minimum GPA if specified

ALTER TABLE internships ADD COLUMN IF NOT EXISTS
  ai_analyzed BOOLEAN DEFAULT false; -- Track if AI has processed this job

ALTER TABLE internships ADD COLUMN IF NOT EXISTS
  ai_analyzed_at TIMESTAMP WITH TIME ZONE; -- When AI analysis was performed

ALTER TABLE internships ADD COLUMN IF NOT EXISTS
  ai_confidence_score DECIMAL(3,2); -- AI confidence in categorization (0-1)

-- Create indexes for new fields
CREATE INDEX IF NOT EXISTS idx_internships_required_languages ON internships USING GIN(required_languages);
CREATE INDEX IF NOT EXISTS idx_internships_required_skills ON internships USING GIN(required_skills);
CREATE INDEX IF NOT EXISTS idx_internships_ai_analyzed ON internships(ai_analyzed);
```

---

## Phase 2: AI Service Integration

### 2.1 Choose AI Provider

**Recommended Options:**
1. **OpenAI GPT-4** (Most accurate, higher cost)
   - API: `https://api.openai.com/v1/chat/completions`
   - Model: `gpt-4o` or `gpt-4o-mini` (cheaper)

2. **Anthropic Claude** (Great for structured output)
   - API: `https://api.anthropic.com/v1/messages`
   - Model: `claude-3-5-sonnet-20241022`

3. **Google Gemini** (Good balance, lower cost)
   - API: `https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent`

### 2.2 Create AI Service Module

Create `server/api/services/aiAnalyzer.js`:

```javascript
import fetch from 'node-fetch';

const AI_API_KEY = process.env.OPENAI_API_KEY || process.env.ANTHROPIC_API_KEY;
const AI_PROVIDER = process.env.AI_PROVIDER || 'openai'; // 'openai', 'anthropic', 'gemini'

/**
 * Analyze a job description using AI
 * @param {Object} job - Job object with description and metadata
 * @returns {Object} Structured categorization data
 */
export async function analyzeJobDescription(job) {
  const prompt = buildAnalysisPrompt(job);

  let analysis;
  switch (AI_PROVIDER) {
    case 'openai':
      analysis = await callOpenAI(prompt);
      break;
    case 'anthropic':
      analysis = await callAnthropic(prompt);
      break;
    case 'gemini':
      analysis = await callGemini(prompt);
      break;
    default:
      throw new Error(`Unknown AI provider: ${AI_PROVIDER}`);
  }

  return parseAIResponse(analysis);
}

function buildAnalysisPrompt(job) {
  return `Analyze this internship job posting and extract structured information.

Job Title: ${job.position_title}
Company: ${job.company_name}
Location: ${job.location}
Description: ${job.description}

Extract the following information in JSON format:
{
  "eligible_years": ["Freshman", "Sophomore", "Junior", "Senior", "Graduate"], // Which class years are eligible
  "required_languages": [], // Programming languages (e.g., ["Python", "Java", "C++"])
  "required_skills": [], // Technical skills and frameworks (e.g., ["React", "Machine Learning", "AWS"])
  "requirements": [], // All key requirements as bullet points
  "student_status": "student|new_grad|experienced|any", // Target candidate type
  "visa_requirements": "us_only|sponsorship_available|sponsorship_not_available|unknown",
  "degree_level": ["bachelors", "masters", "phd"], // Required degree levels
  "major_requirements": [], // Required or preferred majors (e.g., ["Computer Science", "Engineering"])
  "min_gpa": null, // Minimum GPA if mentioned (e.g., 3.5)
  "pay_range": "", // Salary or hourly rate if mentioned
  "duration": "", // Internship length (e.g., "10 weeks", "Summer 2025")
  "confidence_score": 0.0 // Your confidence in this analysis (0-1)
}

Rules:
- Only include years explicitly mentioned or clearly implied
- Extract exact programming languages mentioned
- Include frameworks, tools, and technologies in required_skills
- Be conservative with eligibility - if unclear, use "any"
- Return valid JSON only, no additional text`;
}

async function callOpenAI(prompt) {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${AI_API_KEY}`
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini', // or 'gpt-4o' for better accuracy
      messages: [
        {
          role: 'system',
          content: 'You are an expert at analyzing job descriptions and extracting structured information. Always respond with valid JSON.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      response_format: { type: 'json_object' }, // Force JSON output
      temperature: 0.3, // Lower temperature for more consistent output
      max_tokens: 1000
    })
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

async function callAnthropic(prompt) {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': AI_API_KEY,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.3
    })
  });

  if (!response.ok) {
    throw new Error(`Anthropic API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  return data.content[0].text;
}

function parseAIResponse(responseText) {
  try {
    const parsed = JSON.parse(responseText);

    // Validate and sanitize the response
    return {
      eligible_years: Array.isArray(parsed.eligible_years) ? parsed.eligible_years : [],
      required_languages: Array.isArray(parsed.required_languages) ? parsed.required_languages : [],
      required_skills: Array.isArray(parsed.required_skills) ? parsed.required_skills : [],
      requirements: Array.isArray(parsed.requirements) ? parsed.requirements : [],
      student_status: parsed.student_status || 'any',
      visa_requirements: parsed.visa_requirements || 'unknown',
      degree_level: Array.isArray(parsed.degree_level) ? parsed.degree_level : ['any'],
      major_requirements: Array.isArray(parsed.major_requirements) ? parsed.major_requirements : [],
      min_gpa: parsed.min_gpa ? parseFloat(parsed.min_gpa) : null,
      pay_range: parsed.pay_range || null,
      duration: parsed.duration || null,
      confidence_score: parsed.confidence_score || 0.5
    };
  } catch (error) {
    console.error('Failed to parse AI response:', error);
    return null;
  }
}
```

### 2.3 Environment Variables

Add to `.env` file:

```bash
# AI Configuration
AI_PROVIDER=openai  # or 'anthropic', 'gemini'
OPENAI_API_KEY=your_openai_api_key_here
# ANTHROPIC_API_KEY=your_anthropic_api_key_here  # Alternative
AI_BATCH_SIZE=10  # Process N jobs at a time to avoid rate limits
AI_RETRY_ATTEMPTS=3
AI_TIMEOUT_MS=30000
```

---

## Phase 3: Integrate AI into Scraper

### 3.1 Update Scraper to Call AI Service

Modify `server/scraper-service/app.py` or create a Node.js service:

```javascript
// server/api/services/jobProcessor.js
import { analyzeJobDescription } from './aiAnalyzer.js';
import { pool } from '../database.js';

/**
 * Process jobs in batches with AI analysis
 */
export async function processJobsWithAI(limit = 100) {
  const client = await pool.connect();

  try {
    // Get unanalyzed jobs
    const result = await client.query(`
      SELECT * FROM internships
      WHERE ai_analyzed = false
      AND description IS NOT NULL
      AND description != ''
      ORDER BY created_at DESC
      LIMIT $1
    `, [limit]);

    const jobs = result.rows;
    console.log(`Processing ${jobs.length} jobs with AI...`);

    let successCount = 0;
    let failCount = 0;

    for (const job of jobs) {
      try {
        // Analyze with AI
        const analysis = await analyzeJobDescription(job);

        if (analysis) {
          // Update database with AI results
          await client.query(`
            UPDATE internships SET
              eligible_years = $1,
              required_languages = $2,
              required_skills = $3,
              requirements = $4,
              student_status = $5,
              visa_requirements = $6,
              degree_level = $7,
              major_requirements = $8,
              min_gpa = $9,
              pay_range = $10,
              duration = $11,
              ai_analyzed = true,
              ai_analyzed_at = NOW(),
              ai_confidence_score = $12
            WHERE id = $13
          `, [
            analysis.eligible_years,
            analysis.required_languages,
            analysis.required_skills,
            analysis.requirements,
            analysis.student_status,
            analysis.visa_requirements,
            analysis.degree_level,
            analysis.major_requirements,
            analysis.min_gpa,
            analysis.pay_range,
            analysis.duration,
            analysis.confidence_score,
            job.id
          ]);

          successCount++;
          console.log(`✓ Analyzed: ${job.company_name} - ${job.position_title}`);
        }

        // Rate limiting - wait between requests
        await new Promise(resolve => setTimeout(resolve, 1000));

      } catch (error) {
        failCount++;
        console.error(`✗ Failed to analyze ${job.id}:`, error.message);
      }
    }

    console.log(`AI Analysis complete: ${successCount} success, ${failCount} failed`);
    return { successCount, failCount, total: jobs.length };

  } finally {
    client.release();
  }
}
```

### 3.2 Add API Endpoint

Add to `server/api/index.js`:

```javascript
// AI Analysis endpoint
app.post('/api/internships/analyze', async (req, res) => {
  try {
    const { limit = 100 } = req.body;

    console.log(`Starting AI analysis for ${limit} jobs...`);
    const results = await processJobsWithAI(limit);

    res.json({
      message: 'AI analysis completed',
      ...results
    });
  } catch (error) {
    console.error('Error in AI analysis:', error);
    res.status(500).json({
      error: 'Failed to analyze jobs',
      message: error.message
    });
  }
});
```

---

## Phase 4: Update Frontend

### 4.1 Update TypeScript Interface

Update `client/src/lib/mockData.ts`:

```typescript
export interface Internship {
  id: string;
  company_name: string;
  position_title: string;
  description: string;
  job_type: string;
  location: string;
  eligible_years: string[];

  // AI-extracted fields
  required_languages?: string[];
  required_skills?: string[];
  requirements?: string[];
  student_status?: 'student' | 'new_grad' | 'experienced' | 'any';
  visa_requirements?: 'us_only' | 'sponsorship_available' | 'sponsorship_not_available' | 'unknown';
  degree_level?: string[];
  major_requirements?: string[];
  min_gpa?: number;
  pay_range?: string;
  duration?: string;
  ai_confidence_score?: number;

  // Existing fields
  graduation_years?: number[];
  posted_date: string;
  application_deadline: string | null;
  application_url: string;
  is_active: boolean;
  created_at: string;
}
```

### 4.2 Display AI-Extracted Data

Update `client/src/components/InternshipCard.tsx` to show new fields:

```tsx
{/* Programming Languages */}
{internship.required_languages && internship.required_languages.length > 0 && (
  <div className="mb-3">
    <p className="text-xs font-semibold text-slate-900 mb-1">Languages:</p>
    <div className="flex flex-wrap gap-1">
      {internship.required_languages.map((lang) => (
        <span key={lang} className="px-2 py-0.5 bg-purple-100 text-purple-800 rounded text-xs font-medium">
          {lang}
        </span>
      ))}
    </div>
  </div>
)}

{/* Required Skills */}
{internship.required_skills && internship.required_skills.length > 0 && (
  <div className="mb-3">
    <p className="text-xs font-semibold text-slate-900 mb-1">Skills:</p>
    <div className="flex flex-wrap gap-1">
      {internship.required_skills.slice(0, 5).map((skill) => (
        <span key={skill} className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded text-xs font-medium">
          {skill}
        </span>
      ))}
    </div>
  </div>
)}
```

---

## Phase 5: Automation & Scheduling

### 5.1 Create Cron Job

Add to `server/api/scraperJob.js`:

```javascript
import cron from 'node-cron';
import { processJobsWithAI } from './services/jobProcessor.js';

export function setupAIAnalysisJob() {
  // Run AI analysis every 6 hours
  cron.schedule('0 */6 * * *', async () => {
    console.log('⚡ Starting scheduled AI analysis...');
    try {
      await processJobsWithAI(50); // Process 50 jobs per run
      console.log('✅ Scheduled AI analysis complete');
    } catch (error) {
      console.error('❌ Scheduled AI analysis failed:', error);
    }
  });

  console.log('✅ AI analysis job scheduled (every 6 hours)');
}

// Call in server startup
setupAIAnalysisJob();
```

---

## Phase 6: Testing & Optimization

### 6.1 Test AI Analysis

```bash
# Test AI endpoint manually
curl -X POST http://localhost:3001/api/internships/analyze \
  -H "Content-Type: application/json" \
  -d '{"limit": 10}'
```

### 6.2 Monitor Costs

**Estimated Costs (per 1000 jobs):**
- **OpenAI GPT-4o-mini**: ~$0.30 - $0.60
- **OpenAI GPT-4o**: ~$5 - $10
- **Anthropic Claude**: ~$3 - $6
- **Google Gemini**: ~$0.50 - $2

### 6.3 Error Handling

- Add retry logic for failed API calls
- Log failures to database for review
- Set up alerts for high failure rates
- Implement fallback parsing for common patterns

---

## Phase 7: Advanced Features

### 7.1 Similarity Matching

Use AI embeddings to find similar internships:

```javascript
// Generate embeddings for semantic search
const embedding = await openai.embeddings.create({
  model: "text-embedding-3-small",
  input: job.description
});

// Store in database with pgvector extension
await client.query(`
  UPDATE internships
  SET description_embedding = $1
  WHERE id = $2
`, [embedding.data[0].embedding, job.id]);
```

### 7.2 Intelligent Recommendations

Use AI to match users to internships based on their profile.

---

## Implementation Timeline

1. **Week 1**: Database schema updates + AI service setup
2. **Week 2**: Integration with scraper + testing
3. **Week 3**: Frontend updates + user testing
4. **Week 4**: Optimization + monitoring + production deployment

---

## Key Considerations

✅ **Rate Limits**: Respect AI API rate limits (usually 10-60 req/min)
✅ **Costs**: Monitor API usage to control costs
✅ **Quality**: Validate AI output with manual spot checks
✅ **Privacy**: Ensure job descriptions don't contain sensitive data
✅ **Fallback**: Have manual categorization for edge cases
✅ **Cache**: Store results to avoid re-analyzing same jobs

---

## Next Steps

1. Choose your AI provider (OpenAI recommended for start)
2. Get API key and set up environment variables
3. Run database migrations to add new fields
4. Create AI service module
5. Test with 10-20 jobs manually
6. Integrate into scraper pipeline
7. Monitor accuracy and costs
8. Iterate and improve prompt based on results

Let me know which phase you'd like to implement first! 🚀
