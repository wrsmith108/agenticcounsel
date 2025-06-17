import { Pool } from 'pg';
import { DatabaseConfig } from '@/types';
import bcrypt from 'bcryptjs';
import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'logs/database-seed.log' })
  ]
});

export class DatabaseSeeder {
  private pool: Pool;

  constructor(config: DatabaseConfig) {
    this.pool = new Pool({
      host: config.host,
      port: config.port,
      database: config.database,
      user: config.username,
      password: config.password,
      ssl: config.ssl ? { rejectUnauthorized: false } : false,
    });
  }

  async seedDevelopmentData(): Promise<void> {
    try {
      logger.info('Starting database seeding...');

      // Create test user
      const hashedPassword = await bcrypt.hash('testpassword123', 10);
      
      const testUser = await this.pool.query(`
        INSERT INTO users (
          email, password_hash, first_name, last_name, 
          birth_date, birth_time, birth_location,
          personality_profile, coaching_goals, onboarding_completed
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        ON CONFLICT (email) DO NOTHING
        RETURNING user_id
      `, [
        'test@example.com',
        hashedPassword,
        'John',
        'Doe',
        '1990-06-15',
        '14:30:00',
        'New York, NY',
        JSON.stringify({
          astrological_basis: {
            sun_sign: 'Gemini',
            moon_sign: 'Leo',
            rising_sign: 'Virgo',
            mercury_position: 'Gemini',
            venus_position: 'Cancer',
            mars_position: 'Aries',
            birth_chart_data: {}
          },
          psychological_traits: {
            communication_style: 'Direct and analytical',
            decision_making_pattern: 'Data-driven with intuitive insights',
            stress_response: 'Problem-solving focused',
            leadership_tendency: 'Collaborative leader',
            growth_orientation: 'Continuous learner'
          },
          accuracy_confidence: 0.85,
          generated_at: new Date()
        }),
        ['Career advancement', 'Work-life balance', 'Leadership development'],
        true
      ]);

      if (testUser.rows.length > 0) {
        const userId = testUser.rows[0].user_id;
        logger.info(`Created test user with ID: ${userId}`);

        // Create sample coaching conversation
        const conversation = await this.pool.query(`
          INSERT INTO coaching_conversations (
            user_id, title, session_type, status
          ) VALUES ($1, $2, $3, $4)
          RETURNING conversation_id
        `, [
          userId,
          'Initial Coaching Session',
          'initial_insights',
          'completed'
        ]);

        const conversationId = conversation.rows[0].conversation_id;

        // Add sample messages
        await this.pool.query(`
          INSERT INTO coaching_messages (conversation_id, sender_type, content, metadata)
          VALUES 
            ($1, 'user', 'Hi, I''m looking for help with my career development.', '{}'),
            ($2, 'coach', 'Hello! I''d be happy to help you with your career development. Based on your Gemini sun sign, you likely thrive on variety and intellectual stimulation. What specific areas would you like to focus on?', $3)
        `, [
          conversationId,
          conversationId,
          JSON.stringify({
            personality_applied: true,
            coaching_technique: 'astrological_insight',
            confidence_score: 0.9
          })
        ]);

        // Create sample personality insights
        await this.pool.query(`
          INSERT INTO personality_insights (
            user_id, category, coaching_language, astrological_basis, accuracy_rating
          ) VALUES 
            ($1, 'communication_style', 'Your Gemini sun and Virgo rising create a unique blend of adaptable communication with attention to detail. You likely excel at breaking down complex ideas into digestible pieces.', $2, 4),
            ($3, 'leadership', 'With your Leo moon, you have natural leadership charisma, but your Virgo rising means you lead through service and practical solutions rather than commanding presence.', $4, 5)
        `, [
          userId,
          JSON.stringify({
            sun_sign: 'Gemini',
            rising_sign: 'Virgo',
            relevant_aspects: ['communication', 'adaptability', 'detail_orientation']
          }),
          userId,
          JSON.stringify({
            moon_sign: 'Leo',
            rising_sign: 'Virgo',
            relevant_aspects: ['leadership', 'service', 'charisma']
          })
        ]);

        // Create sample progress tracking
        await this.pool.query(`
          INSERT INTO progress_tracking (
            user_id, goal_category, milestone_type, current_progress, target_progress,
            current_progress_data, milestones, personality_aligned_metrics
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        `, [
          userId,
          'Career advancement',
          'skill_development',
          25,
          100,
          JSON.stringify({
            completion_percentage: 25,
            current_phase: 'Foundation Building',
            achievements: [
              {
                achievement_id: 'skill_assessment_complete',
                title: 'Completed Skills Assessment',
                description: 'Identified key strengths and development areas',
                earned_at: new Date()
              }
            ],
            challenges: [
              {
                challenge_id: 'time_management',
                description: 'Balancing learning with current responsibilities',
                suggested_actions: ['Time blocking', 'Priority matrix', 'Delegation strategies'],
                identified_at: new Date()
              }
            ]
          }),
          JSON.stringify([
            {
              milestone_id: 'skills_assessment',
              title: 'Complete Skills Assessment',
              description: 'Identify current skills and gaps',
              target_date: null,
              completed: true,
              completed_at: new Date()
            },
            {
              milestone_id: 'development_plan',
              title: 'Create Development Plan',
              description: 'Design personalized learning roadmap',
              target_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
              completed: false,
              completed_at: null
            }
          ]),
          JSON.stringify({
            gemini_adaptability_score: 8,
            virgo_detail_orientation: 9,
            leo_confidence_building: 6
          })
        ]);

        logger.info('Sample data created successfully');
      } else {
        logger.info('Test user already exists, skipping sample data creation');
      }

      logger.info('Database seeding completed successfully');
    } catch (error) {
      logger.error('Database seeding failed:', error);
      throw error;
    }
  }

  async clearData(): Promise<void> {
    try {
      logger.info('Clearing development data...');
      
      // Delete in reverse order of dependencies
      await this.pool.query('DELETE FROM coaching_messages');
      await this.pool.query('DELETE FROM coaching_conversations');
      await this.pool.query('DELETE FROM personality_insights');
      await this.pool.query('DELETE FROM progress_tracking');
      await this.pool.query('DELETE FROM users WHERE email = $1', ['test@example.com']);
      
      logger.info('Development data cleared successfully');
    } catch (error) {
      logger.error('Failed to clear development data:', error);
      throw error;
    }
  }

  async close(): Promise<void> {
    await this.pool.end();
  }
}

// CLI interface for seeding
if (require.main === module) {
  const config: DatabaseConfig = {
    host: process.env['DB_HOST'] || 'localhost',
    port: parseInt(process.env['DB_PORT'] || '5432'),
    database: process.env['DB_NAME'] || 'agentic_counsel',
    username: process.env['DB_USER'] || 'postgres',
    password: process.env['DB_PASSWORD'] || '',
    ssl: process.env['DB_SSL'] === 'true'
  };

  const seeder = new DatabaseSeeder(config);
  const command = process.argv[2];

  async function runCommand() {
    try {
      switch (command) {
        case 'seed':
          await seeder.seedDevelopmentData();
          break;
        case 'clear':
          await seeder.clearData();
          break;
        default:
          console.log('Usage:');
          console.log('  npm run db:seed      - Seed development data');
          console.log('  npm run db:clear     - Clear development data');
          break;
      }
    } catch (error) {
      console.error('Command failed:', error);
      process.exit(1);
    } finally {
      await seeder.close();
    }
  }

  runCommand();
}