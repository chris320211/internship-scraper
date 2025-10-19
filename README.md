# Internship Scraper

A comprehensive internship search application that aggregates real internship postings from **multiple sources**: Greenhouse job boards (20+ companies), Levels.fyi, Simplify, and web scraping. Built with React, TypeScript, Node.js, and Python.

## Features

- **Multi-Source Aggregation**: Combines internships from Greenhouse API + web scraping (Levels.fyi, Simplify, etc.)
- **AI-Powered Web Scraping**: Uses [Scrapling](https://github.com/D4Vinci/Scrapling) for intelligent web scraping
- **Live Internship Data**: Automatically fetches real internship postings from 20+ companies
- **Natural Language Search**: Search for internships using natural language queries
- **Advanced Filtering**: Filter by job type, eligible year, location, and remote options
- **Save Opportunities**: Bookmark internships to review later (saved in browser localStorage)
- **Smart Caching**: Backend caches results for 1 hour to improve performance
- **Auto-Categorization**: Automatically categorizes internships by type (SWE, Data Science, ML, etc.)

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
- **Sources**: Levels.fyi, Simplify GitHub repo, Indeed (optional), LinkedIn (optional)

## Architecture

```
┌─────────────┐      HTTP       ┌─────────────┐      Greenhouse API      ┌──────────────┐
│   Frontend  │ ◄─────────────► │   Backend   │ ◄────────────────────────►│  20+ Company │
│  (React)    │   REST API      │  (Express)  │   Fetch & Aggregate      │  Job Boards  │
└─────────────┘                 └─────┬───────┘                           └──────────────┘
                                      │
                                      │ HTTP
                                      ▼
                                ┌─────────────┐      Web Scraping        ┌──────────────┐
                                │   Scraper   │ ◄────────────────────────►│ Levels.fyi   │
                                │   Service   │   Scrapling Library      │ Simplify     │
                                │   (Flask)   │                           │ Indeed, etc. │
                                └─────────────┘                           └──────────────┘
```

## Prerequisites

- Node.js (v18 or higher recommended)
- npm or yarn
- Python 3.10+ (for scraper service)
- Docker and Docker Compose (optional, for containerized setup)

## Local Development Setup

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
│   ├── companies.js              # List of company board tokens
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

### Greenhouse Job Boards (20+ companies)

The backend scrapes internship postings from 20+ companies using Greenhouse:

- Airbnb
- Slack
- Stripe
- Notion
- Coinbase
- Databricks
- Reddit
- Robinhood
- Dropbox
- Square
- Twitch
- DoorDash
- Lyft
- Snap
- Discord
- Shopify
- Atlassian
- GitLab
- Cloudflare
- Asana

To add more companies, edit [server/companies.js](server/companies.js) with their Greenhouse board token.

### Web Scraping Sources (via Scrapling)

The Python scraper service scrapes the following sources:

- **Levels.fyi** - Curated internship listings with salary data
- **Simplify** - GitHub repo with crowd-sourced Summer 2025 internships
- **Indeed** (optional) - Major job board with internship filter
- **LinkedIn** (optional) - Professional network job listings

## How It Works

1. **Greenhouse Scraping**: Backend fetches job listings from 20+ company Greenhouse boards
2. **Web Scraping**: Python service uses Scrapling to scrape Levels.fyi, Simplify, and other sources
3. **Aggregation**: Node.js backend combines internships from both Greenhouse and web scraping
4. **Filtering**: Intelligently identifies internships by looking for keywords like "intern", "internship", "co-op"
5. **Categorization**: Analyzes job titles to categorize internships (Software Engineering, Data Science, ML, etc.)
6. **Caching**: Stores results for 1 hour to improve performance
7. **Frontend Display**: React app fetches from the backend API and provides filtering/search UI

## Configuration

### Environment Variables

Create a `.env` file in the project root:

```env
VITE_API_URL=http://localhost:3001
```

### Adding More Companies

Edit `server/companies.js` to add more companies that use Greenhouse:

```javascript
export const GREENHOUSE_COMPANIES = [
  { name: 'Company Name', token: 'company_greenhouse_token' },
  // Add more...
];
```

To find a company's Greenhouse board token, visit their careers page and look for URLs like:
`https://boards.greenhouse.io/companyname` - the token is `companyname`

## Data Persistence

- **Saved internships**: Stored in browser localStorage (persists across refreshes)
- **User preferences**: Saved during session in localStorage
- **Internship data**: Cached in backend memory for 1 hour

## Performance

- Backend caches all internship data for 1 hour
- Typical response time: <100ms (cached) or 5-10s (fresh fetch from 20 companies)
- No rate limiting on GET requests
- Concurrent fetching from all companies

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
