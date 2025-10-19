FROM python:3.11-slim

WORKDIR /app

# Install system dependencies for Scrapling
RUN apt-get update && apt-get install -y \
    wget \
    gnupg \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Install Scrapling browser dependencies
RUN scrapling install || true

# Copy application code
COPY . .

# Expose port
EXPOSE 3002

# Set environment variables
ENV PYTHONUNBUFFERED=1
ENV PORT=3002

# Start the Flask server
CMD ["python", "app.py"]
