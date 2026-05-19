# Connect_Me Docker & Development Commands

.PHONY: help dev prod build up down logs clean restart seed test

# Default target
help:
	@echo "Available commands:"
	@echo "  make dev          - Start development environment"
	@echo "  make prod         - Start production environment"
	@echo "  make build        - Build all Docker images"
	@echo "  make up           - Start all services"
	@echo "  make down         - Stop all services"
	@echo "  make logs         - View logs (use SERVICE=backend for specific service)"
	@echo "  make clean        - Remove all containers, volumes, and images"
	@echo "  make restart      - Restart all services"
	@echo "  make seed         - Seed the database"
	@echo "  make test         - Run tests"
	@echo "  make shell        - Open shell in backend container"

# Development environment
dev:
	docker compose up -d
	@echo "Development environment started!"
	@echo "Backend: http://localhost:5000"
	@echo "MongoDB: localhost:27017"

# Production environment
prod:
	docker compose -f docker-compose.prod.yml up -d
	@echo "Production environment started!"

# Build images
build:
	docker compose build --no-cache

# Start services
up:
	docker compose up -d

# Stop services
down:
	docker compose down

# View logs
logs:
ifdef SERVICE
	docker compose logs -f $(SERVICE)
else
	docker compose logs -f
endif

# Clean everything
clean:
	docker compose down -v --rmi all
	@echo "Cleaned all containers, volumes, and images"

# Restart services
restart:
	docker compose restart

# Seed database
seed:
	docker compose exec backend npm run seed

# Run tests
test:
	docker compose exec backend npm test

# Open shell in backend
shell:
	docker compose exec backend sh

# Check service health
health:
	@echo "Checking service health..."
	@curl -f http://localhost:5000/health || echo "Backend: DOWN"
	@docker compose exec mongodb mongosh --eval "db.adminCommand('ping')" || echo "MongoDB: DOWN"
	@docker compose exec redis redis-cli ping || echo "Redis: DOWN"
