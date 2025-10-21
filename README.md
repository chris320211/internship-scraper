# Internship Scraper

A comprehensive internship search application that aggregates real internship postings from **multiple sources**: GitHub repositories (4,500+ curated listings), Greenhouse (20+ companies), Lever, and web scraping. Built with React, TypeScript, Node.js, and Python.

## Features

- **Multi-Source Aggregation**: Combines internships from multiple verified sources
  - **🔥 GitHub Repositories** (4,500+ curated internships from SimplifyJobs, Pitt CSC)
  - **Greenhouse** (20+ tech companies)
  - **Lever** (Selected companies with public APIs)
  - **Google Jobs** (via SerpApi with conservative quota management)
  - **Web scraping** (Levels.fyi, LinkedIn via SerpApi)
- **Community-Curated Data**: Leverages open-source GitHub repos with verified, up-to-date postings
- **AI-Powered Web Scraping**: Uses [Scrapling](https://github.com/D4Vinci/Scrapling) for intelligent web scraping
- **Live Internship Data**: Automatically fetches 4,500+ real internship postings daily
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
┌─────────────┐      HTTP       ┌─────────────┐      Multiple Sources    ┌──────────────────────┐
│   Frontend  │ ◄─────────────► │   Backend   │ ◄────────────────────────►│  GitHub Repos:       │
│  (React)    │   REST API      │  (Express)  │   Fetch & Aggregate      │  • SimplifyJobs (3.7k)│
└─────────────┘                 └─────┬───────┘                           │  • Pitt CSC (800+)   │
                                      │                                    └──────────────────────┘
                                      │ HTTP                               ┌──────────────────────┐
                                      ├────────────────────────────────────►│  Job Board APIs:     │
                                      │                                    │  • Greenhouse        │
                                      │                                    │  • Lever             │
                                      ▼                                    └──────────────────────┘
                                ┌─────────────┐      Web Scraping        ┌──────────────┐
                                │   Scraper   │ ◄────────────────────────►│ Levels.fyi   │
                                │   Service   │   Scrapling Library      │ LinkedIn     │
                                │   (Flask)   │                           └──────────────┘
                                └─────────────┘
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

### Optional: Google Jobs & LinkedIn via SerpApi

- Set `SERPAPI_API_KEY` in `.env` (and export it in your shell/Docker environment).
- The scraper service will automatically pull job listings from both **Google Jobs** and **LinkedIn** through SerpApi when the key is provided.
- **Conservative Quota Management**: With a 250 searches/month limit, the Google Jobs scraper uses only **1 search per run** by default, rotating through 8 predefined job categories to maximize coverage.
- SerpApi usage is billed separately—monitor your quota if you enable this feature.
- Without the API key, both integrations are gracefully skipped.
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

# Force refresh from all sources / initate new scrape
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

### 🔥 GitHub Repositories (Primary Source - 4,500+ internships)

**The most valuable data source** - Community-curated, verified internship listings updated daily by thousands of contributors.

#### SimplifyJobs/Summer2025-Internships
- **URL**: https://github.com/SimplifyJobs/Summer2025-Internships
- **Format**: JSON feed via GitHub raw URL
- **Count**: ~3,700 internships
- **Coverage**: Major tech companies (TikTok, Meta, Microsoft, Google, etc.)
- **Update Frequency**: Multiple times daily
- **Verification**: Community-verified, includes application status

#### pittcsc/Summer2025-Internships
- **URL**: https://github.com/pittcsc/Summer2025-Internships
- **Format**: JSON feed via GitHub raw URL
- **Count**: ~800 internships
- **Coverage**: Focus on CS/tech internships
- **Update Frequency**: Daily
- **Verification**: Curated by Pitt CS students and community

**Why GitHub repos are better than APIs:**
- ✅ Always up-to-date (community maintains them)
- ✅ Verified by real applicants
- ✅ Includes application status (still accepting, closed, etc.)
- ✅ No rate limits or authentication needed
- ✅ Free and reliable
- ✅ Cover 100+ companies per repo

### Greenhouse Job Boards (20 companies)

The backend scrapes internship postings from 20 companies using Greenhouse:

- Airbnb, Slack, Stripe, Notion, Coinbase
- Databricks, Reddit, Robinhood, Dropbox, Square
- Twitch, DoorDash, Lyft, Snap, Discord
- Shopify, Atlassian, GitLab, Cloudflare, Asana

To add more companies, edit [server/companies.js](server/companies.js) with their Greenhouse board token.

### Lever Job Boards

**URL Format**: `https://jobs.lever.co/{company}` | **API**: `https://api.lever.co/v0/postings/{company}?mode=json`

Selected companies with public APIs:
- Plaid (~60 total jobs, ~8 internships)

**Note**: Many companies have moved away from public Lever APIs. The infrastructure is in place to add more companies as they're discovered.

### Web Scraping Sources

The Python scraper service scrapes the following sources:

- **GitHub Repositories** (via Scrapling) - Multiple repos with crowd-sourced internships (SimplifyJobs, Ouckah, Pitt CSC)
- **Levels.fyi** (via Scrapling) - Curated internship listings with salary data
- **Google Jobs** (via SerpApi) - Google's job aggregation platform with conservative quota management (250/month)
- **LinkedIn** (via SerpApi) - Professional network job listings
- **Indeed** (disabled) - Major job board with internship filter

## How It Works

1. **GitHub Repository Scraping** (Primary Source):
   - Fetches curated JSON data from SimplifyJobs and Pitt CSC repos via GitHub raw URLs
   - ~4,500 verified internships updated daily by the community
   - Deduplicates overlapping entries across repos
   - Fastest and most reliable source (0.6s fetch time)

2. **Job Board API Scraping**:
   - **Greenhouse**: JSON API at `boards-api.greenhouse.io` (20+ companies)
   - **Lever**: JSON API at `api.lever.co/v0/postings/{company}` (selected companies)

3. **Web Scraping**: Python service uses Scrapling to scrape Levels.fyi and LinkedIn (optional)

4. **Aggregation**: Node.js backend combines internships from all sources into PostgreSQL database

5. **Smart Filtering**: Identifies internships by keywords ("intern", "internship", "co-op")

6. **Auto-Categorization**: Analyzes titles to categorize (Software Engineering, Data Science, ML, etc.)

7. **Scheduled Updates**: Automatic refresh every 6 hours via cron job

8. **Frontend Display**: React app provides real-time search and filtering

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
