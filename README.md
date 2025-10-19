# Internship Scraper

A personalized internship search application that aggregates real internship postings from 20+ tech companies using the Greenhouse Job Board API. Built with React, TypeScript, and Node.js.

## Features

- **Live Internship Data**: Automatically fetches real internship postings from Greenhouse job boards
- **Multi-Company Search**: Aggregates internships from 20+ companies including Airbnb, Stripe, Notion, Coinbase, and more
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

### Backend
- **Runtime**: Node.js 18
- **Framework**: Express.js
- **Caching**: node-cache
- **API**: Greenhouse Job Board API (public, no auth required)

## Architecture

```
┌─────────────┐      HTTP       ┌─────────────┐      Greenhouse API      ┌──────────────┐
│   Frontend  │ ◄─────────────► │   Backend   │ ◄────────────────────────►│  20+ Company │
│  (React)    │   REST API      │  (Express)  │   Fetch & Aggregate      │  Job Boards  │
└─────────────┘                 └─────────────┘                           └──────────────┘
```

## Prerequisites

- Node.js (v18 or higher recommended)
- npm or yarn
- Docker and Docker Compose (optional, for containerized setup)

## Local Development Setup

### Option A: Docker Setup (Recommended)

This will run both the frontend and backend in Docker containers.

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

**Production Mode:**
```bash
docker-compose up --build
```
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001

#### 3. Stop Services

```bash
docker-compose down
```

### Option B: Native Setup

Run the backend and frontend separately on your local machine.

#### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd internship-scraper
```

#### 2. Start the Backend Server

```bash
cd server
npm install
npm start
```

The backend will start on `http://localhost:3001`

#### 3. Start the Frontend (in a new terminal)

```bash
# From the project root
npm install
npm run dev
```

The frontend will start on `http://localhost:5173`

## API Endpoints

### Backend API

- `GET /health` - Health check
- `GET /api/internships` - Get all internships (with optional filters)
  - Query params: `q`, `jobTypes`, `years`, `remoteOnly`
- `POST /api/internships/refresh` - Force refresh cache from Greenhouse
- `GET /api/stats` - Get cache statistics

### Example API Usage

```bash
# Get all internships
curl http://localhost:3001/api/internships

# Search for SWE internships
curl "http://localhost:3001/api/internships?q=software"

# Filter by job type and year
curl "http://localhost:3001/api/internships?jobTypes=Software Engineering&years=Junior,Senior"

# Get only remote internships
curl "http://localhost:3001/api/internships?remoteOnly=true"

# Force refresh from Greenhouse
curl -X POST http://localhost:3001/api/internships/refresh
```

## Available Scripts

### Frontend
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build locally
- `npm run lint` - Run ESLint
- `npm run typecheck` - Run TypeScript type checking

### Backend
- `npm start` - Start production server
- `npm run dev` - Start with auto-reload (Node.js --watch)

## Project Structure

```
internship-scraper/
├── server/                       # Backend API
│   ├── index.js                  # Express server
│   ├── greenhouseService.js      # Greenhouse API integration
│   ├── companies.js              # List of company board tokens
│   ├── package.json
│   └── Dockerfile
├── src/                          # Frontend
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
├── docker-compose.yml            # Multi-container setup
├── nginx.conf                    # Nginx configuration
└── README.md
```

## Companies Tracked

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

## How It Works

1. **Backend scrapes Greenhouse**: On startup and every hour, the backend fetches job listings from all configured company Greenhouse boards
2. **Filters for internships**: Intelligently identifies internships by looking for keywords like "intern", "internship", "co-op" in titles and descriptions
3. **Categorizes automatically**: Analyzes job titles to categorize internships (Software Engineering, Data Science, ML, etc.)
4. **Caches results**: Stores results for 1 hour to avoid rate limiting and improve performance
5. **Frontend displays**: React app fetches from the backend API and provides filtering/search UI

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
