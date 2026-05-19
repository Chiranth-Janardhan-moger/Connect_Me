@echo off
REM Connect_Me Quick Start Script for Windows
REM This script sets up and starts the development environment

echo.
echo 🚀 Connect_Me Quick Start
echo ==========================
echo.

REM Check if Docker is installed
docker --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Docker is not installed. Please install Docker Desktop first.
    echo    Download from: https://www.docker.com/products/docker-desktop/
    pause
    exit /b 1
)

echo ✅ Docker is installed
echo.

REM Create .env file if it doesn't exist
if not exist .env (
    echo 📝 Creating .env file from template...
    copy .env.docker .env
    echo ✅ .env file created
    echo ⚠️  Please edit .env file with your configuration before proceeding
    echo.
    pause
) else (
    echo ✅ .env file already exists
)

echo.
echo 🏗️  Building Docker images...
docker compose build

echo.
echo 🚀 Starting services...
docker compose up -d

echo.
echo ⏳ Waiting for services to be ready...
timeout /t 10 /nobreak >nul

REM Check backend health
echo 🔍 Checking backend health...
set max_attempts=30
set attempt=0

:health_check_loop
if %attempt% geq %max_attempts% goto health_check_failed

curl -f http://localhost:5000/health >nul 2>&1
if errorlevel 1 (
    set /a attempt+=1
    echo    Attempt %attempt%/%max_attempts%...
    timeout /t 2 /nobreak >nul
    goto health_check_loop
)

echo ✅ Backend is healthy!
goto health_check_success

:health_check_failed
echo ❌ Backend health check failed
echo    Check logs with: docker compose logs backend
pause
exit /b 1

:health_check_success
echo.
echo ✅ All services are running!
echo.
echo 📍 Access points:
echo    Backend API: http://localhost:5000
echo    MongoDB:     localhost:27017
echo    Redis:       localhost:6379
echo.
echo 📚 Useful commands:
echo    View logs:        docker compose logs -f
echo    Stop services:    docker compose down
echo    Restart:          docker compose restart
echo    Seed database:    docker compose exec backend npm run seed
echo.
echo 📖 For more information, see DOCKER_SETUP.md
echo.
pause
