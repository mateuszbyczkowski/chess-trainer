-- Initialize Chess Trainer Database
-- This script runs automatically when the PostgreSQL container is first created

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create test database for running tests
CREATE DATABASE chess_trainer_test;

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE chess_trainer_dev TO chess_trainer;
GRANT ALL PRIVILEGES ON DATABASE chess_trainer_test TO chess_trainer;

-- Connect to main database
\c chess_trainer_dev;

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Connect to test database
\c chess_trainer_test;

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Log initialization complete
\echo 'Database initialization complete!'
