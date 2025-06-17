# Database Schema and Migration System

This directory contains the database schema, migration system, and setup scripts for the Agentic Counsel MVP.

## Overview

The database system uses PostgreSQL with a custom migration runner that provides:
- Up/down migration functionality
- Migration tracking and rollback capabilities
- Proper schema versioning
- Development seed data

## Directory Structure

```
src/database/
├── migrations/           # SQL migration files
│   ├── 001_create_users_table.sql
│   ├── 002_create_coaching_conversations_table.sql
│   ├── 003_create_coaching_messages_table.sql
│   ├── 004_create_progress_tracking_table.sql
│   └── 005_create_personality_insights_table.sql
├── migrationRunner.ts    # Migration execution engine
├── setup.ts             # Database initialization and CLI
├── seed.ts              # Development data seeding
└── README.md            # This file
```

## Database Schema

### Core Tables

1. **users** - User accounts and profile information
   - UUID primary key
   - Authentication data (email, password_hash)
   - Personal information (name, birth data)
   - Personality profile (JSONB)
   - Coaching goals and onboarding status

2. **coaching_conversations** - Coaching session containers
   - Links to users
   - Session type and status tracking
   - Duration and satisfaction ratings

3. **coaching_messages** - Individual messages within conversations
   - User and AI coach messages
   - Rich metadata for coaching context
   - Chronological ordering

4. **progress_tracking** - Goal and milestone tracking
   - User progress data (JSONB)
   - Personality-aligned metrics
   - Achievement and challenge tracking

5. **personality_insights** - AI-generated personality insights
   - Astrological basis data
   - Coaching language and accuracy ratings
   - Disclosure tracking

## Environment Setup

1. Copy the environment template:
```bash
cp .env.example .env
```

2. Configure your database connection:
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=agentic_counsel
DB_USER=postgres
DB_PASSWORD=your-password
DB_SSL=false
```

## Migration Commands

### Run Migrations
```bash
# Run all pending migrations
npm run db:migrate

# Check migration status
npm run db:status

# Rollback specific migration
npm run db:rollback 001_create_users_table
```

### Development Data
```bash
# Seed development data
npm run db:seed

# Clear development data
npm run db:clear

# Full setup (migrate + seed)
npm run db:setup
```

## Migration File Format

Each migration file follows this structure:

```sql
-- UP
CREATE TABLE example_table (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_example_name ON example_table(name);

-- DOWN
DROP INDEX IF EXISTS idx_example_name;
DROP TABLE IF EXISTS example_table;
```

## Key Features

### PostgreSQL-Specific Features
- UUID primary keys with `gen_random_uuid()`
- JSONB columns for flexible data storage
- GIN indexes for JSONB query performance
- Array columns for coaching goals
- Partial indexes for filtered queries

### Performance Optimizations
- Comprehensive indexing strategy
- Composite indexes for common query patterns
- Partial indexes for status-based filtering
- GIN indexes for JSONB metadata searches

### Data Integrity
- Foreign key constraints with CASCADE deletes
- Check constraints for data validation
- Automatic timestamp triggers
- Proper transaction handling in migrations

## Development Workflow

1. **Create Migration**: Add new `.sql` file with sequential numbering
2. **Test Migration**: Run `npm run db:migrate` in development
3. **Verify Schema**: Check with `npm run db:status`
4. **Test Rollback**: Ensure DOWN section works correctly
5. **Update Seed Data**: Add relevant test data if needed

## Production Deployment

1. **Backup Database**: Always backup before migrations
2. **Run Migrations**: Use `npm run db:migrate` in production
3. **Verify Status**: Check `npm run db:status` for confirmation
4. **Monitor Logs**: Check migration logs for any issues

## Troubleshooting

### Common Issues

1. **Migration Fails**: Check logs in `logs/migrations.log`
2. **Connection Issues**: Verify environment variables
3. **Permission Errors**: Ensure database user has proper privileges
4. **Rollback Issues**: Check DOWN section syntax

### Recovery

```bash
# Check current migration status
npm run db:status

# Manual rollback if needed
npm run db:rollback <migration_id>

# Re-run migrations
npm run db:migrate
```

## Schema Evolution

When modifying the schema:

1. **Never modify existing migrations** - Create new ones instead
2. **Test rollbacks thoroughly** - Ensure data safety
3. **Consider data migration** - Handle existing data appropriately
4. **Update seed data** - Keep development data current
5. **Document changes** - Update this README as needed

## Integration with Application

The `DatabaseService` class automatically runs migrations on startup:

```typescript
// Automatic migration on connection
await databaseService.connect();
```

This ensures the database schema is always up-to-date when the application starts.