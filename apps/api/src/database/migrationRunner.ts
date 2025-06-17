import { Pool, PoolClient } from 'pg';
import { DatabaseConfig } from '@/types';
import winston from 'winston';
import fs from 'fs';
import path from 'path';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'logs/migrations.log' })
  ]
});

export interface Migration {
  id: string;
  filename: string;
  up: string;
  down: string;
}

export class MigrationRunner {
  private pool: Pool;
  private migrationsPath: string;

  constructor(config: DatabaseConfig) {
    this.pool = new Pool({
      host: config.host,
      port: config.port,
      database: config.database,
      user: config.username,
      password: config.password,
      ssl: config.ssl ? { rejectUnauthorized: false } : false,
    });

    this.migrationsPath = path.join(__dirname, 'migrations');
  }

  async initialize(): Promise<void> {
    try {
      // Create migrations tracking table
      await this.pool.query(`
        CREATE TABLE IF NOT EXISTS schema_migrations (
          id SERIAL PRIMARY KEY,
          migration_id VARCHAR(255) UNIQUE NOT NULL,
          filename VARCHAR(255) NOT NULL,
          executed_at TIMESTAMP DEFAULT NOW()
        )
      `);
      
      logger.info('Migration tracking table initialized');
    } catch (error) {
      logger.error('Failed to initialize migration tracking:', error);
      throw error;
    }
  }

  async getExecutedMigrations(): Promise<string[]> {
    const result = await this.pool.query(
      'SELECT migration_id FROM schema_migrations ORDER BY executed_at ASC'
    );
    return result.rows.map(row => row.migration_id);
  }

  async loadMigrations(): Promise<Migration[]> {
    const migrations: Migration[] = [];
    
    if (!fs.existsSync(this.migrationsPath)) {
      logger.warn('Migrations directory does not exist:', this.migrationsPath);
      return migrations;
    }

    const files = fs.readdirSync(this.migrationsPath)
      .filter(file => file.endsWith('.sql'))
      .sort();

    for (const file of files) {
      const filePath = path.join(this.migrationsPath, file);
      const content = fs.readFileSync(filePath, 'utf8');
      
      // Split migration file into UP and DOWN sections
      const sections = content.split('-- DOWN');
      if (sections.length !== 2) {
        throw new Error(`Invalid migration format in ${file}. Must contain -- DOWN separator.`);
      }

      const up = sections[0]?.replace('-- UP', '').trim() || '';
      const down = sections[1]?.trim() || '';
      
      const migrationId = file.replace('.sql', '');
      
      migrations.push({
        id: migrationId,
        filename: file,
        up,
        down
      });
    }

    return migrations;
  }

  async runMigrations(): Promise<void> {
    await this.initialize();
    
    const allMigrations = await this.loadMigrations();
    const executedMigrations = await this.getExecutedMigrations();
    
    const pendingMigrations = allMigrations.filter(
      migration => !executedMigrations.includes(migration.id)
    );

    if (pendingMigrations.length === 0) {
      logger.info('No pending migrations to run');
      return;
    }

    logger.info(`Running ${pendingMigrations.length} pending migrations`);

    for (const migration of pendingMigrations) {
      await this.runMigration(migration);
    }

    logger.info('All migrations completed successfully');
  }

  async runMigration(migration: Migration): Promise<void> {
    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');
      
      logger.info(`Running migration: ${migration.filename}`);
      
      // Execute the UP migration
      await client.query(migration.up);
      
      // Record the migration as executed
      await client.query(
        'INSERT INTO schema_migrations (migration_id, filename) VALUES ($1, $2)',
        [migration.id, migration.filename]
      );
      
      await client.query('COMMIT');
      logger.info(`Migration completed: ${migration.filename}`);
      
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error(`Migration failed: ${migration.filename}`, error);
      throw error;
    } finally {
      client.release();
    }
  }

  async rollbackMigration(migrationId: string): Promise<void> {
    const allMigrations = await this.loadMigrations();
    const migration = allMigrations.find(m => m.id === migrationId);
    
    if (!migration) {
      throw new Error(`Migration not found: ${migrationId}`);
    }

    const executedMigrations = await this.getExecutedMigrations();
    if (!executedMigrations.includes(migrationId)) {
      throw new Error(`Migration not executed: ${migrationId}`);
    }

    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');
      
      logger.info(`Rolling back migration: ${migration.filename}`);
      
      // Execute the DOWN migration
      await client.query(migration.down);
      
      // Remove the migration record
      await client.query(
        'DELETE FROM schema_migrations WHERE migration_id = $1',
        [migrationId]
      );
      
      await client.query('COMMIT');
      logger.info(`Migration rolled back: ${migration.filename}`);
      
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error(`Migration rollback failed: ${migration.filename}`, error);
      throw error;
    } finally {
      client.release();
    }
  }

  async getStatus(): Promise<{ executed: string[], pending: string[] }> {
    const allMigrations = await this.loadMigrations();
    const executedMigrations = await this.getExecutedMigrations();
    
    const pending = allMigrations
      .filter(m => !executedMigrations.includes(m.id))
      .map(m => m.id);

    return {
      executed: executedMigrations,
      pending
    };
  }

  async close(): Promise<void> {
    await this.pool.end();
  }
}