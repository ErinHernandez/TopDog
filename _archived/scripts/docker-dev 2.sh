#!/usr/bin/env bash
# Docker development helper for Idesaign
# Provides convenient commands for managing the development environment
#
# Usage: ./scripts/docker-dev.sh [command]
#
# Commands:
#   up       Start all services (default)
#   down     Stop all services
#   logs     Follow app logs
#   shell    Open shell in app container
#   redis    Open Redis CLI
#   reset    Remove volumes and rebuild

set -euo pipefail

COMPOSE_FILE="docker-compose.yml"

case "${1:-up}" in
  up)
    echo "🚀 Starting Idesaign development environment..."
    # Create .env.local if it doesn't exist
    if [ ! -f .env.local ]; then
      echo "ℹ️  Creating .env.local from .env.example..."
      if [ -f .env.example ]; then
        cp .env.example .env.local
      else
        echo "# Idesaign local environment" > .env.local
      fi
    fi
    docker compose -f "$COMPOSE_FILE" up -d
    echo ""
    echo "✅ Idesaign is starting at http://localhost:3000"
    echo "✅ Redis is available at localhost:6379"
    echo ""
    echo "Run './scripts/docker-dev.sh logs' to follow app logs"
    echo ""
    ;;
  down)
    echo "🛑 Stopping all services..."
    docker compose -f "$COMPOSE_FILE" down
    echo "✅ Services stopped"
    ;;
  logs)
    echo "📋 Following app logs (Ctrl+C to exit)..."
    docker compose -f "$COMPOSE_FILE" logs -f app
    ;;
  shell)
    echo "🔧 Opening shell in app container..."
    docker compose -f "$COMPOSE_FILE" exec app sh
    ;;
  redis)
    echo "💾 Opening Redis CLI..."
    docker compose -f "$COMPOSE_FILE" exec redis redis-cli
    ;;
  reset)
    echo "🔄 Removing containers, volumes, and rebuilding..."
    docker compose -f "$COMPOSE_FILE" down -v
    docker compose -f "$COMPOSE_FILE" up -d --build
    echo "✅ Environment reset and rebuilt"
    ;;
  *)
    echo "Usage: $0 {up|down|logs|shell|redis|reset}"
    exit 1
    ;;
esac
