#!/bin/bash

# Connect_Me Quick Start Script
# This script sets up and starts the development environment

set -e

echo "🚀 Connect_Me Quick Start"
echo "=========================="
echo ""

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker Desktop first."
    echo "   Download from: https://www.docker.com/products/docker-desktop/"
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker compose &> /dev/null; then
    echo "❌ Docker Compose is not installed."
    exit 1
fi

echo "✅ Docker is installed"
echo ""

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env file from template..."
    cp .env.docker .env
    echo "✅ .env file created"
    echo "⚠️  Please edit .env file with your configuration before proceeding"
    echo ""
    read -p "Press Enter to continue after editing .env file..."
else
    echo "✅ .env file already exists"
fi

echo ""
echo "🏗️  Building Docker images..."
docker compose build

echo ""
echo "🚀 Starting services..."
docker compose up -d

echo ""
echo "⏳ Waiting for services to be ready..."
sleep 10

# Check backend health
echo "🔍 Checking backend health..."
max_attempts=30
attempt=0

while [ $attempt -lt $max_attempts ]; do
    if curl -f http://localhost:5000/health &> /dev/null; then
        echo "✅ Backend is healthy!"
        break
    fi
    attempt=$((attempt + 1))
    echo "   Attempt $attempt/$max_attempts..."
    sleep 2
done

if [ $attempt -eq $max_attempts ]; then
    echo "❌ Backend health check failed"
    echo "   Check logs with: docker compose logs backend"
    exit 1
fi

echo ""
echo "✅ All services are running!"
echo ""
echo "📍 Access points:"
echo "   Backend API: http://localhost:5000"
echo "   MongoDB:     localhost:27017"
echo "   Redis:       localhost:6379"
echo ""
echo "📚 Useful commands:"
echo "   View logs:        docker compose logs -f"
echo "   Stop services:    docker compose down"
echo "   Restart:          docker compose restart"
echo "   Seed database:    docker compose exec backend npm run seed"
echo ""
echo "📖 For more information, see DOCKER_SETUP.md"
echo ""
