// Re-export all types from the shared package
export * from '@agentic-counsel/shared';

// Backend-specific type alias for User with password
export type { UserWithPassword as User } from '@agentic-counsel/shared';