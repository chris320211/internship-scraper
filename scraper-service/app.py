"""
Flask API server for web scraping service
"""
from flask import Flask, jsonify, request
from flask_cors import CORS
from scrapers import scrape_all_sources
import os

app = Flask(__name__)
CORS(app)

# Cache for scraped results
cache = {
    'data': [],
    'timestamp': None
}

CACHE_DURATION = 3600  # 1 hour in seconds


@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({
        'status': 'ok',
        'service': 'scraper-service',
        'version': '1.0.0'
    })


@app.route('/api/scrape', methods=['GET'])
def scrape():
    """Scrape internships from web sources"""
    try:
        keywords = request.args.get('q', 'software engineering intern')

        print(f"Starting web scraping with keywords: {keywords}")

        # Scrape all sources
        internships = scrape_all_sources(keywords)

        return jsonify({
            'total': len(internships),
            'internships': internships,
            'sources': list(set([job.get('source', 'Unknown') for job in internships]))
        })

    except Exception as e:
        print(f"Error in scrape endpoint: {e}")
        return jsonify({
            'error': 'Scraping failed',
            'message': str(e)
        }), 500


@app.route('/api/scrape/sources', methods=['GET'])
def sources():
    """List available scraping sources"""
    return jsonify({
        'sources': [
            {
                'name': 'Levels.fyi',
                'description': 'Curated internship listings with salary data',
                'url': 'https://www.levels.fyi/internships/'
            },
            {
                'name': 'GitHub Repos',
                'description': 'Multiple GitHub repos with crowd-sourced internships (SimplifyJobs, Ouckah, Pitt CSC)',
                'url': 'https://github.com/SimplifyJobs/Summer2026-Internships'
            },
            {
                'name': 'Google Jobs (SerpApi)',
                'description': 'Google Jobs search results via SerpApi - conservative quota management (250/month)',
                'url': 'https://www.google.com/search?q=internships',
                'status': 'requires SERPAPI_API_KEY'
            },
            {
                'name': 'LinkedIn (SerpApi)',
                'description': 'Professional network job listings fetched via SerpApi',
                'url': 'https://www.linkedin.com/jobs',
                'status': 'requires SERPAPI_API_KEY'
            },
            {
                'name': 'Indeed',
                'description': 'Major job board with internship filter',
                'url': 'https://www.indeed.com',
                'status': 'disabled'  # May require anti-bot bypass
            }
        ]
    })


if __name__ == '__main__':
    port = int(os.environ.get('PORT', 3002))
    print(f"🔍 Scraper service starting on port {port}")
    print("📡 Available endpoints:")
    print(f"   - GET http://localhost:{port}/health")
    print(f"   - GET http://localhost:{port}/api/scrape")
    print(f"   - GET http://localhost:{port}/api/scrape/sources")
    app.run(host='0.0.0.0', port=port, debug=True)
