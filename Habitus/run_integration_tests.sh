#!/bin/bash

# Integration Test Runner for Habitus Backend
# This script starts the required services and runs integration tests

set -e  # Exit on error

echo "======================================================================"
echo "Habitus Integration Test Runner"
echo "======================================================================"
echo

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Error: Docker is not running"
    echo "Please start Docker and try again"
    exit 1
fi

echo "✓ Docker is running"

# Navigate to project directory
cd "$(dirname "$0")"

# Start services
echo
echo "Starting Docker services..."
docker compose up -d

echo "Waiting for services to initialize..."
sleep 10

# Check service health
echo
echo "Checking service status..."
docker compose ps

# Wait for Python backend
echo
echo "Waiting for Python backend..."
max_attempts=30
attempt=0
while [ $attempt -lt $max_attempts ]; do
    if curl -s http://localhost:8000/docs > /dev/null 2>&1; then
        echo "✓ Python backend is ready"
        break
    fi
    attempt=$((attempt + 1))
    echo "  Waiting... ($attempt/$max_attempts)"
    sleep 2
done

if [ $attempt -eq $max_attempts ]; then
    echo "❌ Python backend failed to start"
    docker logs habitus-python-1 --tail 20
    exit 1
fi

# Wait for Java backend
echo
echo "Waiting for Java backend..."
max_attempts=30
attempt=0
while [ $attempt -lt $max_attempts ]; do
    if curl -s http://localhost:8080/actuator/health > /dev/null 2>&1 || curl -s http://localhost:8080 > /dev/null 2>&1; then
        echo "✓ Java backend is ready"
        break
    fi
    attempt=$((attempt + 1))
    echo "  Waiting... ($attempt/$max_attempts)"
    sleep 2
done

if [ $attempt -eq $max_attempts ]; then
    echo "❌ Java backend failed to start"
    docker logs habitus-java-1 --tail 20
    exit 1
fi

# Run integration tests
echo
echo "======================================================================"
echo "Running Integration Tests"
echo "======================================================================"
echo

python backend_python/tests/test_integration.py

# Capture exit code
test_exit_code=$?

echo
echo "======================================================================"
if [ $test_exit_code -eq 0 ]; then
    echo "✅ All integration tests passed!"
else
    echo "❌ Some integration tests failed"
fi
echo "======================================================================"

exit $test_exit_code
