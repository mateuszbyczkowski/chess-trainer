# Docker Setup Guide

This guide explains how to set up and use Docker for local development.

---

## 📦 What's Included

- **PostgreSQL 15** - Main database for development and testing
- **pgAdmin 4** - Web-based database management UI (optional)

**Note:** Backend and frontend run locally using `npm run dev` - they are NOT containerized.

---

## 🚀 Quick Start

### 1. Prerequisites

Make sure you have installed:
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (includes Docker Compose)
- Node.js 20+ LTS
- npm or pnpm

### 2. Set Up Environment Variables

Copy the example environment file:

```bash
cp .env.example .env
```

Edit `.env` and add your OAuth credentials (you can get them later, but the file must exist):
- Lichess OAuth: https://lichess.org/account/oauth/app
- Google OAuth: https://console.cloud.google.com/apis/credentials

### 3. Start PostgreSQL

Start the database container:

```bash
docker-compose up -d
```

This will:
- ✅ Start PostgreSQL on `localhost:5432`
- ✅ Create databases: `chess_trainer_dev` and `chess_trainer_test`
- ✅ Initialize with extensions (uuid-ossp)
- ✅ Persist data in a Docker volume

### 4. Verify Database is Running

Check the container status:

```bash
docker-compose ps
```

You should see:
```
NAME                  STATUS    PORTS
chess-trainer-db      Up        0.0.0.0:5432->5432/tcp
```

Test the connection:

```bash
docker-compose exec postgres psql -U chess_trainer -d chess_trainer_dev -c "SELECT version();"
```

### 5. Run Backend and Frontend

In separate terminal windows:

**Terminal 1 - Backend:**
```bash
cd backend
npm install
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm install
npm run dev
```

---

## 🗄️ Database Management

### Using pgAdmin (Web UI)

Start pgAdmin along with PostgreSQL:

```bash
docker-compose --profile tools up -d
```

Access pgAdmin:
- **URL:** http://localhost:5050
- **Email:** admin@chess-trainer.local
- **Password:** admin

**Add PostgreSQL Server in pgAdmin:**
1. Click "Add New Server"
2. **General Tab:**
   - Name: `Chess Trainer Local`
3. **Connection Tab:**
   - Host: `postgres` (container name)
   - Port: `5432`
   - Database: `chess_trainer_dev`
   - Username: `chess_trainer`
   - Password: `chess_trainer_password`
4. Click "Save"

### Using psql (Command Line)

Connect to the database:

```bash
# Connect to dev database
docker-compose exec postgres psql -U chess_trainer -d chess_trainer_dev

# Connect to test database
docker-compose exec postgres psql -U chess_trainer -d chess_trainer_test
```

**Useful psql commands:**
```sql
\l          -- List all databases
\dt         -- List all tables
\d users    -- Describe 'users' table
\q          -- Quit
```

### Using a GUI Client (TablePlus, DBeaver, etc.)

**Connection Details:**
- **Host:** localhost
- **Port:** 5432
- **Database:** chess_trainer_dev
- **Username:** chess_trainer
- **Password:** chess_trainer_password

---

## 🔧 Docker Commands

### Start Containers

```bash
# Start PostgreSQL only
docker-compose up -d

# Start PostgreSQL + pgAdmin
docker-compose --profile tools up -d

# View logs
docker-compose logs -f postgres
```

### Stop Containers

```bash
# Stop all containers
docker-compose down

# Stop and remove volumes (⚠️ deletes all data!)
docker-compose down -v
```

### Restart Containers

```bash
docker-compose restart
```

### View Container Status

```bash
docker-compose ps
```

### Access Container Shell

```bash
# Access PostgreSQL container
docker-compose exec postgres bash

# Access psql directly
docker-compose exec postgres psql -U chess_trainer -d chess_trainer_dev
```

---

## 🗃️ Database Persistence

Database data is stored in a Docker volume: `chess-trainer_postgres_data`

### View Volumes

```bash
docker volume ls | grep chess-trainer
```

### Backup Database

```bash
# Backup to file
docker-compose exec postgres pg_dump -U chess_trainer chess_trainer_dev > backup.sql

# Restore from file
cat backup.sql | docker-compose exec -T postgres psql -U chess_trainer -d chess_trainer_dev
```

### Reset Database

```bash
# Stop containers and remove volumes
docker-compose down -v

# Start fresh
docker-compose up -d

# Verify initialization
docker-compose logs postgres
```

---

## 🧪 Running Tests

The test database (`chess_trainer_test`) is automatically created.

Set the test database URL in your backend `.env`:

```env
DATABASE_URL_TEST=postgresql://chess_trainer:chess_trainer_password@localhost:5432/chess_trainer_test
```

Run tests:

```bash
cd backend
npm test
```

---

## 🐛 Troubleshooting

### Port 5432 Already in Use

If you have PostgreSQL installed locally:

**Option 1:** Stop local PostgreSQL
```bash
# macOS
brew services stop postgresql

# Linux
sudo systemctl stop postgresql
```

**Option 2:** Change Docker port in `docker-compose.yml`
```yaml
ports:
  - "5433:5432"  # Use 5433 on host instead
```

Then update `DATABASE_URL` to use port `5433`.

### Container Won't Start

Check logs:
```bash
docker-compose logs postgres
```

Common issues:
- Volume corruption: `docker-compose down -v` then `docker-compose up -d`
- Permission issues: Ensure Docker has access to the project directory

### Can't Connect to Database

1. Verify container is running: `docker-compose ps`
2. Check health status: `docker-compose exec postgres pg_isready`
3. Test connection: `docker-compose exec postgres psql -U chess_trainer -d chess_trainer_dev`
4. Verify `.env` has correct `DATABASE_URL`

### pgAdmin Won't Start

Start with profile flag:
```bash
docker-compose --profile tools up -d
```

Access at: http://localhost:5050

---

## 🔒 Security Notes

⚠️ **Important:** The default credentials are for **local development only**.

**For production:**
- Change all passwords to strong, randomly generated values
- Use environment-specific `.env` files
- Never commit `.env` files to Git (they're in `.gitignore`)
- Use secret management tools (GitHub Secrets, AWS Secrets Manager, etc.)

---

## 📝 Configuration Files

| File | Purpose |
|------|---------|
| `docker-compose.yml` | Docker services configuration |
| `.env` | Environment variables (create from `.env.example`) |
| `infra/docker/init-db/01-init.sql` | Database initialization script |

---

## 🎯 Next Steps

1. ✅ Start Docker containers
2. ✅ Set up backend (`cd backend && npm install`)
3. ✅ Run database migrations (`npm run migration:run`)
4. ✅ Import sample puzzles (`npm run import:sample-puzzles`)
5. ✅ Start development servers (`npm run dev`)

---

## 📚 Additional Resources

- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [PostgreSQL Docker Image](https://hub.docker.com/_/postgres)
- [pgAdmin Documentation](https://www.pgadmin.org/docs/)

---

**Last Updated:** 2026-01-26
