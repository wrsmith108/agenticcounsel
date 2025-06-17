'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Send, 
  ArrowLeft, 
  Bot, 
  User, 
  Loader2,
  MessageCircle,
  CheckCircle,
  Clock
} from 'lucide-react';
import apiClient from '@/lib/api';
import socketService from '@/lib/socket';
import { CoachingSession, Message } from '@/types';

export default function CoachingChatPage() {
  const [conversation, setConversation] = useState<CoachingSession | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [connected, setConnected] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user, isAuthenticated } = useAuth();
  const params = useParams();
  const router = useRouter();
  const conversationId = params.id as string;

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    if (conversationId) {
      loadConversation();
      setupWebSocket();
    }

    return () => {
      socketService.disconnect();
    };
  }, [conversationId, isAuthenticated, router]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadConversation = async () => {
    try {
      setLoading(true);
      
      // Load conversation details
      const conversationResponse = await apiClient.getCoachingConversation(conversationId);
      if (conversationResponse.success && conversationResponse.data) {
        setConversation(conversationResponse.data);
      }

      // Load messages
      const messagesResponse = await apiClient.getCoachingMessages(conversationId);
      if (messagesResponse.success && messagesResponse.data) {
        setMessages(messagesResponse.data);
      }
    } catch (error) {
      console.error('Failed to load conversation:', error);
    } finally {
      setLoading(false);
    }
  };

  const setupWebSocket = () => {
    // Get token from localStorage or API client
    const token = localStorage.getItem('auth_token') || apiClient.getToken();
    socketService.connect(token || undefined);
    
    socketService.on('connect', () => {
      setConnected(true);
      socketService.joinConversation(conversationId);
    });

    socketService.on('disconnect', () => {
      setConnected(false);
    });

    socketService.on('new_message', (message: Message) => {
      setMessages(prev => [...prev, message]);
    });

    socketService.on('conversation_updated', (updatedConversation: CoachingSession) => {
      setConversation(updatedConversation);
    });
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newMessage.trim() || sending || !conversation) return;

    try {
      setSending(true);
      
      const response = await apiClient.sendCoachingMessage(conversationId, {
        content: newMessage.trim(),
        message_type: 'user_message'
      });

      if (response.success) {
        setNewMessage('');
      }
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setSending(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    );
  }

  if (!conversation) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Conversation not found</h2>
          <p className="text-gray-600 mb-4">This coaching session may have been deleted or you don't have access to it.</p>
          <button
            onClick={() => router.push('/dashboard')}
            className="bg-purple-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-purple-700"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm border-b px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.push('/dashboard')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="h-5 w-5 text-gray-600" />
            </button>
            <div>
              <h1 className="text-lg font-semibold text-gray-900 capitalize">
                {conversation.session_type.replace('_', ' ')} Session
              </h1>
              <div className="flex items-center space-x-4 text-sm text-gray-500">
                <div className="flex items-center space-x-1">
                  <Clock className="h-4 w-4" />
                  <span>Started {new Date(conversation.created_at).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center space-x-1">
                  {conversation.status === 'completed' ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <div className={`h-2 w-2 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}`} />
                  )}
                  <span className="capitalize">{conversation.status}</span>
                </div>
              </div>
            </div>
          </div>
          
          {conversation.status === 'active' && (
            <button
              onClick={async () => {
                try {
                  await apiClient.endCoachingSession(conversationId);
                  setConversation(prev => prev ? { ...prev, status: 'completed' } : null);
                } catch (error) {
                  console.error('Failed to end session:', error);
                }
              }}
              className="bg-gray-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-gray-700 transition-colors"
            >
              End Session
            </button>
          )}
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="max-w-4xl mx-auto space-y-4">
          {messages.length === 0 ? (
            <div className="text-center py-12">
              <Bot className="h-12 w-12 text-purple-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Welcome to your coaching session!
              </h3>
              <p className="text-gray-600 mb-6">
                I'm here to help you with your {conversation.session_type.replace('_', ' ').toLowerCase()}. 
                What would you like to explore today?
              </p>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.message_id}
                className={`flex ${message.sender_type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs lg:max-w-md px-4 py-3 rounded-lg ${
                    message.sender_type === 'user'
                      ? 'bg-purple-600 text-white'
                      : 'bg-white text-gray-900 shadow-sm border border-gray-200'
                  }`}
                >
                  <div className="flex items-start space-x-2">
                    {message.sender_type === 'ai_coach' && (
                      <Bot className="h-5 w-5 text-purple-600 mt-0.5 flex-shrink-0" />
                    )}
                    {message.sender_type === 'user' && (
                      <User className="h-5 w-5 text-purple-100 mt-0.5 flex-shrink-0" />
                    )}
                    <div className="flex-1">
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">
                        {message.content}
                      </p>
                      <p className={`text-xs mt-2 ${
                        message.sender_type === 'user' ? 'text-purple-200' : 'text-gray-500'
                      }`}>
                        {formatTimestamp(message.created_at)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Message Input */}
      {conversation.status === 'active' && (
        <div className="bg-white border-t p-4">
          <form onSubmit={sendMessage} className="max-w-4xl mx-auto">
            <div className="flex space-x-4">
              <div className="flex-1">
                <textarea
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type your message..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                  rows={3}
                  disabled={sending || !connected}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage(e);
                    }
                  }}
                />
              </div>
              <button
                type="submit"
                disabled={!newMessage.trim() || sending || !connected}
                className="bg-purple-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
              >
                {sending ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Send className="h-5 w-5" />
                )}
              </button>
            </div>
            <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
              <span>Press Enter to send, Shift+Enter for new line</span>
              <div className="flex items-center space-x-1">
                <div className={`h-2 w-2 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}`} />
                <span>{connected ? 'Connected' : 'Disconnected'}</span>
              </div>
            </div>
          </form>
        </div>
      )}

      {conversation.status === 'completed' && (
        <div className="bg-gray-100 border-t p-4">
          <div className="max-w-4xl mx-auto text-center">
            <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
            <p className="text-gray-600">This coaching session has been completed.</p>
            <button
              onClick={() => router.push('/dashboard')}
              className="mt-4 bg-purple-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-purple-700"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      )}
    </div>
  );
}