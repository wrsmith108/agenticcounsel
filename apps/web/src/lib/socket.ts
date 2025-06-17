import { io, Socket } from 'socket.io-client';
import { Message } from '@/types';

class SocketService {
  private socket: Socket | null = null;
  private isConnected = false;

  connect(token?: string): void {
    if (this.socket?.connected) {
      return;
    }

    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001';
    
    // Get token from parameter or localStorage
    const authToken = token || (typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null);
    
    this.socket = io(wsUrl, {
      auth: authToken ? {
        token: authToken
      } : {},
      transports: ['websocket', 'polling']
    });

    this.socket.on('connect', () => {
      console.log('Connected to WebSocket server');
      this.isConnected = true;
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from WebSocket server');
      this.isConnected = false;
    });

    this.socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
      this.isConnected = false;
    });
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }

  // Join a coaching conversation room
  joinConversation(conversationId: string): void {
    if (this.socket && this.isConnected) {
      this.socket.emit('join_conversation', { conversationId });
    }
  }

  // Leave a coaching conversation room
  leaveConversation(conversationId: string): void {
    if (this.socket && this.isConnected) {
      this.socket.emit('leave_conversation', { conversationId });
    }
  }

  // Send a message in real-time
  sendMessage(conversationId: string, content: string, metadata?: any): void {
    if (this.socket && this.isConnected) {
      this.socket.emit('send_message', {
        conversationId,
        content,
        metadata
      });
    }
  }

  // Listen for new messages
  onMessage(callback: (message: Message) => void): void {
    if (this.socket) {
      this.socket.on('new_message', callback);
    }
  }

  // Listen for coach responses
  onCoachResponse(callback: (message: Message) => void): void {
    if (this.socket) {
      this.socket.on('coach_response', callback);
    }
  }

  // Listen for typing indicators
  onTyping(callback: (data: { conversationId: string; isTyping: boolean; sender: string }) => void): void {
    if (this.socket) {
      this.socket.on('typing', callback);
    }
  }

  // Send typing indicator
  sendTyping(conversationId: string, isTyping: boolean): void {
    if (this.socket && this.isConnected) {
      this.socket.emit('typing', { conversationId, isTyping });
    }
  }

  // Listen for conversation status updates
  onConversationUpdate(callback: (data: { conversationId: string; status: string }) => void): void {
    if (this.socket) {
      this.socket.on('conversation_update', callback);
    }
  }

  // Remove event listeners
  off(event: string, callback?: (...args: any[]) => void): void {
    if (this.socket) {
      this.socket.off(event, callback);
    }
  }

  // Generic event listener for custom events
  on(event: string, callback: (...args: any[]) => void): void {
    if (this.socket) {
      this.socket.on(event, callback);
    }
  }

  // Generic event emitter for custom events
  emit(event: string, data?: any): void {
    if (this.socket && this.isConnected) {
      this.socket.emit(event, data);
    }
  }

  // Check connection status
  get connected(): boolean {
    return this.isConnected && !!this.socket?.connected;
  }

  // Get socket instance for custom events
  getSocket(): Socket | null {
    return this.socket;
  }
}

// Create singleton instance
const socketService = new SocketService();

export default socketService;