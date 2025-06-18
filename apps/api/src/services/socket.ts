import { Server as SocketIOServer, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import winston from 'winston';
import { User } from '@/types';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'logs/socket.log' })
  ]
});

interface AuthenticatedSocket extends Socket {
  user?: Omit<User, 'password_hash'>;
}

export class SocketService {
  private static instance: SocketService | null = null;
  private io: SocketIOServer;
  private connectedUsers: Map<string, string> = new Map(); // userId -> socketId

  constructor(io: SocketIOServer) {
    this.io = io;
    SocketService.instance = this;
  }

  static getInstance(): SocketService | null {
    return SocketService.instance;
  }

  initialize(): void {
    // Authentication middleware
    this.io.use(async (socket: AuthenticatedSocket, next) => {
      try {
        const token = socket.handshake.auth['token'] || socket.handshake.headers.authorization?.replace('Bearer ', '');
        
        if (!token) {
          return next(new Error('Authentication token required'));
        }

        const jwtSecret = process.env['JWT_SECRET'];
        if (!jwtSecret) {
          return next(new Error('Server configuration error'));
        }

        const decoded = jwt.verify(token, jwtSecret) as any;
        
        if (!decoded.user_id) {
          return next(new Error('Invalid token payload'));
        }

        // Attach user info to socket
        socket.user = {
          user_id: decoded.user_id,
          email: decoded.email,
          first_name: decoded.first_name,
          last_name: decoded.last_name,
          birth_date: decoded.birth_date,
          birth_time: decoded.birth_time,
          birth_location: decoded.birth_location,
          personality_profile: decoded.personality_profile,
          coaching_goals: decoded.coaching_goals,
          onboarding_completed: decoded.onboarding_completed,
          created_at: decoded.created_at,
          updated_at: decoded.updated_at
        };

        next();
      } catch (error) {
        logger.error('Socket authentication error:', error);
        next(new Error('Authentication failed'));
      }
    });

    // Handle connections
    this.io.on('connection', (socket: AuthenticatedSocket) => {
      this.handleConnection(socket);
    });

    logger.info('Socket service initialized');
  }

  private handleConnection(socket: AuthenticatedSocket): void {
    const userId = socket.user?.user_id;
    if (!userId) {
      socket.disconnect();
      return;
    }

    logger.info('User connected via socket', { userId, socketId: socket.id });
    
    // Track connected user
    this.connectedUsers.set(userId, socket.id);

    // Join user to their personal room
    socket.join(`user:${userId}`);

    // Handle coaching session events
    this.setupCoachingHandlers(socket);

    // Handle disconnection
    socket.on('disconnect', () => {
      logger.info('User disconnected', { userId, socketId: socket.id });
      this.connectedUsers.delete(userId);
    });

    // Send connection confirmation
    socket.emit('connected', {
      message: 'Connected to Agentic Counsel',
      userId: userId,
      timestamp: new Date()
    });
  }

  private setupCoachingHandlers(socket: AuthenticatedSocket): void {
    const userId = socket.user?.user_id;
    if (!userId) return;

    // Join coaching session
    socket.on('join_coaching_session', (data: { conversation_id: string }) => {
      const { conversation_id } = data;
      
      logger.info('User joining coaching session', { userId, conversationId: conversation_id });
      
      // Join the conversation room
      socket.join(`conversation:${conversation_id}`);
      
      // Confirm session joined
      socket.emit('session_joined', {
        conversation_id,
        timestamp: new Date()
      });

      // Notify others in the session (if any)
      socket.to(`conversation:${conversation_id}`).emit('user_joined_session', {
        user_id: userId,
        timestamp: new Date()
      });
    });

    // Leave coaching session
    socket.on('leave_coaching_session', (data: { conversation_id: string }) => {
      const { conversation_id } = data;
      
      logger.info('User leaving coaching session', { userId, conversationId: conversation_id });
      
      // Leave the conversation room
      socket.leave(`conversation:${conversation_id}`);
      
      // Confirm session left
      socket.emit('session_left', {
        conversation_id,
        timestamp: new Date()
      });

      // Notify others in the session
      socket.to(`conversation:${conversation_id}`).emit('user_left_session', {
        user_id: userId,
        timestamp: new Date()
      });
    });

    // Handle typing indicators
    socket.on('typing_start', (data: { conversation_id: string }) => {
      const { conversation_id } = data;
      
      socket.to(`conversation:${conversation_id}`).emit('user_typing', {
        user_id: userId,
        typing: true,
        timestamp: new Date()
      });
    });

    socket.on('typing_stop', (data: { conversation_id: string }) => {
      const { conversation_id } = data;
      
      socket.to(`conversation:${conversation_id}`).emit('user_typing', {
        user_id: userId,
        typing: false,
        timestamp: new Date()
      });
    });

    // Handle message acknowledgments
    socket.on('message_received', (data: { message_id: string; conversation_id: string }) => {
      const { message_id, conversation_id } = data;
      
      // Acknowledge message receipt
      socket.emit('message_acknowledged', {
        message_id,
        conversation_id,
        timestamp: new Date()
      });
    });

    // Handle session status updates
    socket.on('session_status_update', (data: { conversation_id: string; status: string }) => {
      const { conversation_id, status } = data;
      
      logger.info('Session status update', { userId, conversationId: conversation_id, status });
      
      // Broadcast status update to session participants
      this.io.to(`conversation:${conversation_id}`).emit('session_status_changed', {
        conversation_id,
        status,
        updated_by: userId,
        timestamp: new Date()
      });
    });
  }

  // Public methods for sending messages from other services

  sendMessageToUser(userId: string, event: string, data: any): void {
    const socketId = this.connectedUsers.get(userId);
    if (socketId) {
      this.io.to(`user:${userId}`).emit(event, {
        ...data,
        timestamp: new Date()
      });
      logger.debug('Message sent to user', { userId, event });
    } else {
      logger.debug('User not connected, message not sent', { userId, event });
    }
  }

  sendMessageToConversation(conversationId: string, event: string, data: any): void {
    this.io.to(`conversation:${conversationId}`).emit(event, {
      ...data,
      timestamp: new Date()
    });
    logger.debug('Message sent to conversation', { conversationId, event });
  }

  sendCoachingMessage(conversationId: string, message: any): void {
    this.sendMessageToConversation(conversationId, 'coaching_message', {
      message_id: message.message_id,
      conversation_id: conversationId,
      sender_type: message.sender_type,
      content: message.content,
      metadata: message.metadata,
      created_at: message.created_at
    });
  }

  sendAhaMoment(conversationId: string, userId: string, ahaMomentData: any): void {
    this.sendMessageToConversation(conversationId, 'aha_moment_delivered', {
      conversation_id: conversationId,
      user_id: userId,
      aha_moment_type: ahaMomentData.type,
      content: ahaMomentData.content,
      timestamp: new Date()
    });

    // Also send to user's personal channel for notifications
    this.sendMessageToUser(userId, 'aha_moment_notification', {
      aha_moment_type: ahaMomentData.type,
      conversation_id: conversationId,
      preview: ahaMomentData.content.substring(0, 100) + '...'
    });
  }

  sendProgressUpdate(userId: string, progressData: any): void {
    this.sendMessageToUser(userId, 'progress_updated', {
      goal_category: progressData.goal_category,
      current_progress: progressData.current_progress,
      milestones_achieved: progressData.milestones_achieved,
      next_milestone: progressData.next_milestone
    });
  }

  sendPersonalityInsight(userId: string, insight: any): void {
    this.sendMessageToUser(userId, 'personality_insight', {
      insight_id: insight.insight_id,
      category: insight.category,
      coaching_language: insight.coaching_language,
      accuracy_rating: insight.accuracy_rating
    });
  }

  // Session management helpers

  isUserConnected(userId: string): boolean {
    return this.connectedUsers.has(userId);
  }

  getConnectedUsers(): string[] {
    return Array.from(this.connectedUsers.keys());
  }

  getConnectionCount(): number {
    return this.connectedUsers.size;
  }

  disconnectUser(userId: string): void {
    const socketId = this.connectedUsers.get(userId);
    if (socketId) {
      const socket = this.io.sockets.sockets.get(socketId);
      if (socket) {
        socket.disconnect(true);
      }
      this.connectedUsers.delete(userId);
      logger.info('User forcibly disconnected', { userId });
    }
  }

  // Broadcast system messages

  broadcastSystemMessage(message: string, data?: any): void {
    this.io.emit('system_message', {
      message,
      data,
      timestamp: new Date()
    });
    logger.info('System message broadcasted', { message });
  }

  broadcastMaintenanceNotice(message: string, scheduledTime?: Date): void {
    this.io.emit('maintenance_notice', {
      message,
      scheduled_time: scheduledTime,
      timestamp: new Date()
    });
    logger.info('Maintenance notice broadcasted', { message, scheduledTime });
  }

  // Health check

  getHealthStatus(): any {
    return {
      connected_users: this.getConnectionCount(),
      total_connections: this.io.engine.clientsCount,
      rooms: Array.from(this.io.sockets.adapter.rooms.keys()),
      timestamp: new Date()
    };
  }
}