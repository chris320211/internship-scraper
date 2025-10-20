# Internship Scraper

A comprehensive internship search application that aggregates real internship postings from **multiple sources**: Greenhouse, Lever, Ashby, Workday, SmartRecruiters (50+ companies total), Levels.fyi, Simplify, and web scraping. Built with React, TypeScript, Node.js, and Python.

## Features

- **Multi-Source Aggregation**: Combines internships from 5 major job board platforms + web scraping
  - **Greenhouse** (20 companies)
  - **Lever** (10 companies including Netflix, Canva, Figma)
  - **Ashby** (8 companies including Anthropic, OpenAI, Ramp)
  - **Workday** (8 large firms including Amazon, Apple, Microsoft)
  - **SmartRecruiters** (6 companies including Visa, LinkedIn, Bosch)
  - **Web scraping** (Levels.fyi, Simplify, LinkedIn)
- **AI-Powered Web Scraping**: Uses [Scrapling](https://github.com/D4Vinci/Scrapling) for intelligent web scraping
- **Live Internship Data**: Automatically fetches real internship postings from 50+ companies
- **Natural Language Search**: Search for internships using natural language queries
- **Advanced Filtering**: Filter by job type, eligible year, location, and remote options
- **Save Opportunities**: Bookmark internships to review later (saved in browser localStorage)
- **Smart Caching**: Backend caches results for 1 hour to improve performance
- **Auto-Categorization**: Automatically categorizes internships by type (SWE, Data Science, ML, etc.)
- **LinkedIn Coverage**: Optional SerpApi integration adds LinkedIn job listings alongside other sources

## Tech Stack

### Frontend
- **Framework**: React 18 + TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Storage**: Browser LocalStorage
- **Icons**: Lucide React

### Backend (Node.js)
- **Runtime**: Node.js 18
- **Framework**: Express.js
- **Caching**: node-cache
- **API**: Greenhouse Job Board API (public, no auth required)

### Scraper Service (Python)
- **Runtime**: Python 3.11
- **Framework**: Flask
- **Scraping**: [Scrapling](https://github.com/D4Vinci/Scrapling) - Advanced web scraping library
- **Sources**: Levels.fyi, Simplify GitHub repo, LinkedIn (via SerpApi), Indeed (optional)

## Architecture

```
┌─────────────┐      HTTP       ┌─────────────┐      Multiple APIs       ┌──────────────────┐
│   Frontend  │ ◄─────────────► │   Backend   │ ◄────────────────────────►│  Job Boards:     │
│  (React)    │   REST API      │  (Express)  │   Fetch & Aggregate      │  • Greenhouse    │
└─────────────┘                 └─────┬───────┘                           │  • Lever         │
                                      │                                    │  • Ashby         │
                                      │ HTTP                               │  • Workday       │
                                      ▼                                    │  • SmartRecruiters│
                                ┌─────────────┐      Web Scraping        └──────────────────┘
                                │   Scraper   │ ◄────────────────────────┬──────────────┐
                                │   Service   │   Scrapling Library      │ Levels.fyi   │
                                │   (Flask)   │                           │ Simplify     │
                                └─────────────┘                           │ LinkedIn     │
                                                                           └──────────────┘
```

## Prerequisites

- Node.js (v18 or higher recommended)
- npm or yarn
- Python 3.10+ (for scraper service)
- Docker and Docker Compose (optional, for containerized setup)

## Local Development Setup

### Database Setup (PostgreSQL)

- Ensure a PostgreSQL instance is running and reachable using the credentials in `.env` (defaults to `postgres:postgres@localhost:5432/internship_scraper`).
- The backend automatically executes `database/schema.sql` on startup, so the required tables and triggers will be created or updated the first time the API connects.
- When using Docker, the schema is applied by the `db` service; for native development, start PostgreSQL manually (e.g., `docker compose up db` or a local service) before running the backend.

### Optional: LinkedIn via SerpApi

- Set `SERPAPI_API_KEY` in `.env` (and export it in your shell/Docker environment).
- The scraper service will automatically pull LinkedIn job listings through SerpApi when the key is provided; without it, the integration is skipped.
- SerpApi usage is billed separately—monitor your quota if you enable this feature.
### Option A: Docker Setup (Recommended)

This will run the frontend, backend API, and scraper service in Docker containers.

#### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd internship-scraper
```

#### 2. Start All Services

**Development Mode (with hot reload):**
```bash
docker-compose --profile dev up
```
- Frontend: http://localhost:5173
- Backend API: http://localhost:3001
- Scraper Service: http://localhost:3002

**Production Mode:**
```bash
docker-compose up --build
```
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001
- Scraper Service: http://localhost:3002

#### 3. Stop Services

```bash
docker-compose down
```

### Option B: Native Setup

Run all services separately on your local machine.

#### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd internship-scraper
```

#### 2. Start the Scraper Service (Terminal 1)

```bash
cd scraper-service
pip install -r requirements.txt
scrapling install  # Install browser dependencies
python app.py
```

The scraper service will start on `http://localhost:3002`

#### 3. Start the Backend Server (Terminal 2)

```bash
cd server
npm install
npm start
```

The backend will start on `http://localhost:3001`

#### 4. Start the Frontend (Terminal 3)

```bash
# From the project root
npm install
npm run dev
```

The frontend will start on `http://localhost:5173`

## API Endpoints

### Backend API (Port 3001)

- `GET /health` - Health check
- `GET /api/internships` - Get all internships (combines Greenhouse + web scraped)
  - Query params: `q`, `jobTypes`, `years`, `remoteOnly`, `includeWeb` (default: true)
- `POST /api/internships/refresh` - Force refresh cache from all sources
- `GET /api/stats` - Get cache statistics

### Scraper Service API (Port 3002)

- `GET /health` - Health check
- `GET /api/scrape` - Scrape internships from web sources
  - Query params: `q` (search keywords)
- `GET /api/scrape/sources` - List available scraping sources

### Example API Usage

```bash
# Get all internships (Greenhouse + web scraped)
curl http://localhost:3001/api/internships

# Get only Greenhouse internships (disable web scraping)
curl "http://localhost:3001/api/internships?includeWeb=false"

# Search for SWE internships
curl "http://localhost:3001/api/internships?q=software"

# Filter by job type and year
curl "http://localhost:3001/api/internships?jobTypes=Software Engineering&years=Junior,Senior"

# Get only remote internships
curl "http://localhost:3001/api/internships?remoteOnly=true"

# Force refresh from all sources
curl -X POST http://localhost:3001/api/internships/refresh

# Directly scrape from web sources
curl "http://localhost:3002/api/scrape?q=machine+learning+intern"

# List available scraping sources
curl http://localhost:3002/api/scrape/sources
```

## Available Scripts

### Frontend
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build locally
- `npm run lint` - Run ESLint
- `npm run typecheck` - Run TypeScript type checking

### Backend (Node.js)
- `npm start` - Start production server
- `npm run dev` - Start with auto-reload

### Scraper Service (Python)
- `python app.py` - Start Flask server

## Project Structure

```
internship-scraper/
├── server/                       # Backend API (Node.js)
│   ├── index.js                  # Express server
│   ├── greenhouseService.js      # Greenhouse API integration
│   ├── leverService.js           # Lever API integration
│   ├── ashbyService.js           # Ashby API integration
│   ├── workdayService.js         # Workday API integration
│   ├── smartRecruitersService.js # SmartRecruiters API integration
│   ├── scraperJob.js             # Job scheduling and scraping orchestration
│   ├── database.js               # PostgreSQL database operations
│   ├── companies.js              # List of company board tokens for all platforms
│   ├── package.json
│   └── Dockerfile
├── scraper-service/              # Web scraper service (Python)
│   ├── app.py                    # Flask server
│   ├── scrapers.py               # Scrapling-based scrapers
│   ├── requirements.txt          # Python dependencies
│   └── Dockerfile
├── src/                          # Frontend (React)
│   ├── components/
│   │   ├── InternshipCard.tsx    # Individual internship display
│   │   ├── PromptSetup.tsx       # Initial search setup screen
│   │   └── SearchFilters.tsx     # Filter controls
│   ├── lib/
│   │   ├── api.ts                # Backend API client
│   │   ├── mockData.ts           # TypeScript types
│   │   └── localStorage.ts       # Browser storage utilities
│   ├── App.tsx                   # Main application component
│   └── main.tsx                  # Application entry point
├── Dockerfile                    # Frontend Docker build
├── docker-compose.yml            # Multi-container orchestration
├── nginx.conf                    # Nginx configuration
└── README.md
```

## Data Sources

### Greenhouse Job Boards (20 companies)

The backend scrapes internship postings from 20 companies using Greenhouse:

- Airbnb, Slack, Stripe, Notion, Coinbase
- Databricks, Reddit, Robinhood, Dropbox, Square
- Twitch, DoorDash, Lyft, Snap, Discord
- Shopify, Atlassian, GitLab, Cloudflare, Asana

To add more companies, edit [server/companies.js](server/companies.js) with their Greenhouse board token.

### Lever Job Boards (10 companies)

**URL Format**: `https://jobs.lever.co/{company}` | **API**: `https://api.lever.co/v0/postings/{company}?mode=json`

Companies included:
- Netflix, Canva, Rippling, Instacart, Grammarly
- Scale AI, Figma, Brex, Plaid, Airtable

### Ashby Job Boards (8 companies)

**URL Format**: `https://jobs.ashbyhq.com/{company}.json`

Companies included:
- Anthropic, OpenAI, Ramp, Mercury
- Anduril, Retool, Watershed, Deel

### Workday (8 companies)

**URL Format**: `https://{subdomain}.myworkdaysite.com/wday/cxs/{org}/{tenant}/jobs`

Large firms included:
- Amazon, Apple, Microsoft, Salesforce
- Oracle, IBM, Intel, Cisco

### SmartRecruiters (6 companies)

**API**: `https://api.smartrecruiters.com/v1/companies/{companyId}/postings`

Companies included:
- Visa, LinkedIn, Bosch
- IKEA, Sephora, McDonald's

### Web Scraping Sources (via Scrapling)

The Python scraper service scrapes the following sources:

- **Levels.fyi** - Curated internship listings with salary data
- **Simplify** - GitHub repo with crowd-sourced Summer 2025 internships
- **Indeed** (optional) - Major job board with internship filter
- **LinkedIn** (optional) - Professional network job listings

## How It Works

1. **Multi-Platform Scraping**: Backend fetches job listings from 5 major job board platforms:
   - **Greenhouse**: JSON API at `boards-api.greenhouse.io`
   - **Lever**: JSON API at `api.lever.co/v0/postings/{company}`
   - **Ashby**: JSON feed at `jobs.ashbyhq.com/{company}.json`
   - **Workday**: JSON via POST to `/wday/cxs/{org}/{tenant}/jobs`
   - **SmartRecruiters**: REST API at `api.smartrecruiters.com/v1/companies/{id}/postings`
2. **Web Scraping**: Python service uses Scrapling to scrape Levels.fyi, Simplify, and LinkedIn
3. **Aggregation**: Node.js backend combines internships from all sources into a unified database
4. **Filtering**: Intelligently identifies internships by looking for keywords like "intern", "internship", "co-op"
5. **Categorization**: Analyzes job titles to categorize internships (Software Engineering, Data Science, ML, etc.)
6. **Caching**: Stores results in PostgreSQL database with automatic refresh every 6 hours
7. **Frontend Display**: React app fetches from the backend API and provides filtering/search UI

## Configuration

### Environment Variables

Create a `.env` file in the project root:

```env
VITE_API_URL=http://localhost:3001
```

### Adding More Companies

Edit `server/companies.js` to add more companies. Different platforms have different URL structures:

**Greenhouse**:
```javascript
export const GREENHOUSE_COMPANIES = [
  { name: 'Company Name', token: 'companyname' },
];
```
Find tokens at: `https://boards.greenhouse.io/{token}`

**Lever**:
```javascript
export const LEVER_COMPANIES = [
  { name: 'Company Name', token: 'companyname' },
];
```
Find tokens at: `https://jobs.lever.co/{token}`

**Ashby**:
```javascript
export const ASHBY_COMPANIES = [
  { name: 'Company Name', token: 'companyname' },
];
```
Find tokens at: `https://jobs.ashbyhq.com/{token}`

**Workday** (requires org, tenant, and subdomain):
```javascript
export const WORKDAY_COMPANIES = [
  { name: 'Company', org: 'company', tenant: 'careers', subdomain: 'wd5' },
];
```

**SmartRecruiters**:
```javascript
export const SMARTRECRUITERS_COMPANIES = [
  { name: 'Company Name', companyId: 'CompanyName' },
];
```
Find at: `https://api.smartrecruiters.com/v1/companies/{companyId}/postings`

## Data Persistence

- **Saved internships**: Stored in browser localStorage (persists across refreshes)
- **User preferences**: Saved during session in localStorage
- **Internship data**: Cached in backend memory for 1 hour

## Performance

- Backend stores all internship data in PostgreSQL database
- Automatic refresh every 6 hours via cron job
- Typical response time: <100ms (from database)
- No rate limiting on GET requests
- Concurrent fetching from all companies and platforms (50+ sources)

## Troubleshooting

### "Failed to load internships" error

1. Make sure the backend server is running on port 3001
2. Check backend logs for errors
3. Try refreshing the cache: `curl -X POST http://localhost:3001/api/internships/refresh`

### Backend not starting

1. Make sure port 3001 is not in use: `lsof -i:3001`
2. Check you're using Node.js v18 or higher: `node --version`
3. Install dependencies: `cd server && npm install`

### No internships found

1. Check if companies have active internship postings on their Greenhouse boards
2. Try manually refreshing: POST to `/api/internships/refresh`
3. Check backend logs for API errors

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT
