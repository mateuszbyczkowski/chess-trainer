# Chess Trainer - Development Makefile
# Simplifies common Docker and development tasks

.PHONY: help up down restart logs ps clean test setup db-reset db-backup db-restore

# Default target
help:
	@echo "Chess Trainer - Development Commands"
	@echo ""
	@echo "Docker Commands:"
	@echo "  make up          - Start PostgreSQL"
	@echo "  make up-tools    - Start PostgreSQL + pgAdmin"
	@echo "  make down        - Stop all containers"
	@echo "  make restart     - Restart containers"
	@echo "  make logs        - View PostgreSQL logs"
	@echo "  make ps          - Show container status"
	@echo "  make clean       - Stop containers and remove volumes (⚠️  deletes data)"
	@echo ""
	@echo "Database Commands:"
	@echo "  make db-shell    - Open psql shell"
	@echo "  make db-reset    - Reset database (⚠️  deletes all data)"
	@echo "  make db-backup   - Backup database to backup.sql"
	@echo "  make db-restore  - Restore database from backup.sql"
	@echo ""
	@echo "Development Commands:"
	@echo "  make setup       - Initial setup (copy .env, start Docker)"
	@echo "  make dev         - Start backend and frontend dev servers"
	@echo "  make install     - Install dependencies (backend + frontend)"
	@echo ""

# Docker commands
up:
	@echo "Starting PostgreSQL..."
	docker-compose up -d
	@echo "✅ PostgreSQL is running on localhost:5432"

up-tools:
	@echo "Starting PostgreSQL + pgAdmin..."
	docker-compose --profile tools up -d
	@echo "✅ PostgreSQL is running on localhost:5432"
	@echo "✅ pgAdmin is running on http://localhost:5050"

down:
	@echo "Stopping containers..."
	docker-compose down
	@echo "✅ Containers stopped"

restart:
	@echo "Restarting containers..."
	docker-compose restart
	@echo "✅ Containers restarted"

logs:
	docker-compose logs -f postgres

ps:
	docker-compose ps

clean:
	@echo "⚠️  This will delete all database data!"
	@read -p "Are you sure? [y/N] " -n 1 -r; \
	echo; \
	if [[ $$REPLY =~ ^[Yy]$$ ]]; then \
		docker-compose down -v; \
		echo "✅ Containers and volumes removed"; \
	fi

# Database commands
db-shell:
	@echo "Opening psql shell (type \q to exit)..."
	docker-compose exec postgres psql -U chess_trainer -d chess_trainer_dev

db-reset:
	@echo "⚠️  This will reset the database!"
	@read -p "Are you sure? [y/N] " -n 1 -r; \
	echo; \
	if [[ $$REPLY =~ ^[Yy]$$ ]]; then \
		docker-compose down -v; \
		docker-compose up -d; \
		sleep 5; \
		echo "✅ Database reset complete"; \
	fi

db-backup:
	@echo "Backing up database..."
	docker-compose exec postgres pg_dump -U chess_trainer chess_trainer_dev > backup.sql
	@echo "✅ Database backed up to backup.sql"

db-restore:
	@if [ ! -f backup.sql ]; then \
		echo "❌ backup.sql not found"; \
		exit 1; \
	fi
	@echo "Restoring database from backup.sql..."
	cat backup.sql | docker-compose exec -T postgres psql -U chess_trainer -d chess_trainer_dev
	@echo "✅ Database restored"

# Development commands
setup:
	@if [ ! -f .env ]; then \
		echo "Creating .env from .env.example..."; \
		cp .env.example .env; \
		echo "⚠️  Please edit .env and add your OAuth credentials"; \
	else \
		echo ".env already exists"; \
	fi
	@make up
	@echo ""
	@echo "✅ Setup complete!"
	@echo ""
	@echo "Next steps:"
	@echo "  1. Edit .env and add OAuth credentials"
	@echo "  2. Run: make install"
	@echo "  3. Run: cd backend && npm run migration:run"
	@echo "  4. Run: make dev"

install:
	@echo "Installing backend dependencies..."
	cd backend && npm install
	@echo "Installing frontend dependencies..."
	cd frontend && npm install
	@echo "✅ Dependencies installed"

dev:
	@echo "Starting development servers..."
	@echo "Backend will run on http://localhost:3000"
	@echo "Frontend will run on http://localhost:5173"
	@echo ""
	@echo "Run these commands in separate terminals:"
	@echo "  Terminal 1: cd backend && npm run dev"
	@echo "  Terminal 2: cd frontend && npm run dev"
