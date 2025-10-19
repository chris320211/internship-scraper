# Internship Scraper

A personalized internship search application built with React and TypeScript. This application helps students find and filter internship opportunities based on their preferences with mock data for demonstration purposes.

## Features

- **Natural Language Search**: Search for internships using natural language queries
- **Advanced Filtering**: Filter by job type, eligible year, location, and remote options
- **Save Opportunities**: Bookmark internships to review later (saved in browser localStorage)
- **Mock Data**: Pre-populated with 12 sample internships from top tech companies
- **Session-based Preferences**: Your search preferences are saved during your session

## Tech Stack

- **Frontend**: React 18 + TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Storage**: Browser LocalStorage
- **Icons**: Lucide React

## Prerequisites

- Node.js (v18 or higher recommended)
- npm or yarn
- Docker and Docker Compose (optional, for containerized setup)

## Local Development Setup

You can run this application either natively with Node.js or using Docker.

### Option A: Docker Setup (Recommended)

#### Development Mode with Hot Reload

1. **Clone the Repository**
   ```bash
   git clone <your-repo-url>
   cd internship-scraper
   ```

2. **Run with Docker Compose**
   ```bash
   docker-compose --profile dev up
   ```

   The application will be available at `http://localhost:5173` with hot reload enabled.

#### Production Mode

1. **Build and Run**
   ```bash
   docker-compose up --build
   ```

   The application will be available at `http://localhost:3000`

2. **Run in Background**
   ```bash
   docker-compose up -d
   ```

3. **Stop the Application**
   ```bash
   docker-compose down
   ```

#### Using Docker Directly

```bash
# Build the image
docker build -t internship-scraper .

# Run the container
docker run -p 3000:80 internship-scraper
```

### Option B: Native Setup

#### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd internship-scraper
```

#### 2. Install Dependencies

```bash
npm install
```

#### 3. Run the Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:5173`

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build locally
- `npm run lint` - Run ESLint
- `npm run typecheck` - Run TypeScript type checking

## Project Structure

```
internship-scraper/
├── src/
│   ├── components/
│   │   ├── InternshipCard.tsx    # Individual internship display
│   │   ├── PromptSetup.tsx       # Initial search setup screen
│   │   └── SearchFilters.tsx     # Filter controls
│   ├── lib/
│   │   ├── mockData.ts           # Mock internship data
│   │   └── localStorage.ts       # Browser storage utilities
│   ├── App.tsx                   # Main application component
│   └── main.tsx                  # Application entry point
├── Dockerfile                    # Docker production build
├── docker-compose.yml            # Docker Compose configuration
├── nginx.conf                    # Nginx configuration for production
├── index.html
├── package.json
└── vite.config.ts
```

## Usage

1. **Initial Setup**: Enter your search preferences using natural language (e.g., "SWE internships for juniors")
2. **Browse Results**: View internships matching your criteria
3. **Filter**: Use the filter controls to refine your search
4. **Save**: Click the bookmark icon to save interesting opportunities
5. **New Search**: Click "New Search" to start over with different criteria

## Mock Data

The application comes with 12 pre-populated internships from companies like:
- Google
- Meta
- Microsoft
- Amazon
- Stripe
- Airbnb
- Tesla
- Cloudflare
- Netflix
- Figma
- Shopify
- Notion

You can modify the mock data in [src/lib/mockData.ts](src/lib/mockData.ts) to add more internships or customize existing ones.

## Data Persistence

- Saved internships are stored in your browser's localStorage
- User preferences are saved during your session
- Data persists across page refreshes but is local to your browser

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT
