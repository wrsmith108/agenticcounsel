import { MigrationRunner } from './migrationRunner';
import { DatabaseConfig } from '@/types';
import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'logs/database-setup.log' })
  ]
});

export class DatabaseSetup {
  private migrationRunner: MigrationRunner;

  constructor(config: DatabaseConfig) {
    this.migrationRunner = new MigrationRunner(config);
  }

  async initialize(): Promise<void> {
    try {
      logger.info('Starting database initialization...');
      
      // Run all pending migrations
      await this.migrationRunner.runMigrations();
      
      logger.info('Database initialization completed successfully');
    } catch (error) {
      logger.error('Database initialization failed:', error);
      throw error;
    }
  }

  async getStatus(): Promise<{ executed: string[], pending: string[] }> {
    return await this.migrationRunner.getStatus();
  }

  async rollback(migrationId: string): Promise<void> {
    try {
      logger.info(`Rolling back migration: ${migrationId}`);
      await this.migrationRunner.rollbackMigration(migrationId);
      logger.info(`Migration rollback completed: ${migrationId}`);
    } catch (error) {
      logger.error(`Migration rollback failed: ${migrationId}`, error);
      throw error;
    }
  }

  async close(): Promise<void> {
    await this.migrationRunner.close();
  }
}

// CLI interface for running migrations
if (require.main === module) {
  const config: DatabaseConfig = {
    host: process.env['DB_HOST'] || 'localhost',
    port: parseInt(process.env['DB_PORT'] || '5432'),
    database: process.env['DB_NAME'] || 'agentic_counsel',
    username: process.env['DB_USER'] || 'postgres',
    password: process.env['DB_PASSWORD'] || '',
    ssl: process.env['DB_SSL'] === 'true'
  };

  const setup = new DatabaseSetup(config);
  const command = process.argv[2];

  async function runCommand() {
    try {
      switch (command) {
        case 'migrate':
          await setup.initialize();
          break;
        case 'status':
          const status = await setup.getStatus();
          console.log('Migration Status:');
          console.log('Executed:', status.executed);
          console.log('Pending:', status.pending);
          break;
        case 'rollback':
          const migrationId = process.argv[3];
          if (!migrationId) {
            console.error('Migration ID required for rollback');
            process.exit(1);
          }
          await setup.rollback(migrationId);
          break;
        default:
          console.log('Usage:');
          console.log('  npm run db:migrate     - Run pending migrations');
          console.log('  npm run db:status      - Show migration status');
          console.log('  npm run db:rollback <id> - Rollback specific migration');
          break;
      }
    } catch (error) {
      console.error('Command failed:', error);
      process.exit(1);
    } finally {
      await setup.close();
    }
  }

  runCommand();
}