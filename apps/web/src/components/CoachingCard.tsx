'use client';

import React from 'react';
import Link from 'next/link';
import { 
  MessageCircle, 
  Clock, 
  CheckCircle, 
  Play, 
  Calendar,
  Target,
  TrendingUp,
  Brain,
  Users,
  ArrowRight
} from 'lucide-react';
import { CoachingSession } from '@/types';

interface CoachingCardProps {
  session: CoachingSession;
  showActions?: boolean;
  compact?: boolean;
  onStartSession?: (sessionType: string) => void;
}

const CoachingCard: React.FC<CoachingCardProps> = ({ 
  session, 
  showActions = true, 
  compact = false,
  onStartSession 
}) => {
  const getSessionIcon = (sessionType: string) => {
    switch (sessionType) {
      case 'coaching_conversation':
        return <MessageCircle className="h-5 w-5" />;
      case 'progress_review':
        return <TrendingUp className="h-5 w-5" />;
      case 'goal_setting':
        return <Target className="h-5 w-5" />;
      case 'action_planning':
        return <Calendar className="h-5 w-5" />;
      case 'initial_insights':
        return <Brain className="h-5 w-5" />;
      case 'team_coaching':
        return <Users className="h-5 w-5" />;
      default:
        return <MessageCircle className="h-5 w-5" />;
    }
  };

  const getSessionColor = (sessionType: string) => {
    switch (sessionType) {
      case 'coaching_conversation':
        return 'text-purple-600 bg-purple-50';
      case 'progress_review':
        return 'text-green-600 bg-green-50';
      case 'goal_setting':
        return 'text-blue-600 bg-blue-50';
      case 'action_planning':
        return 'text-orange-600 bg-orange-50';
      case 'initial_insights':
        return 'text-indigo-600 bg-indigo-50';
      case 'team_coaching':
        return 'text-pink-600 bg-pink-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-700';
      case 'completed':
        return 'bg-blue-100 text-blue-700';
      case 'paused':
        return 'bg-yellow-100 text-yellow-700';
      case 'cancelled':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const formatSessionType = (sessionType: string) => {
    return sessionType
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const formatDate = (date: Date | string) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatTime = (date: Date | string) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (compact) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-4 hover:border-purple-300 hover:shadow-sm transition-all">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-lg ${getSessionColor(session.session_type)}`}>
              {getSessionIcon(session.session_type)}
            </div>
            <div>
              <h3 className="font-medium text-gray-900">
                {formatSessionType(session.session_type)}
              </h3>
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <Clock className="h-3 w-3" />
                <span>{formatDate(session.created_at)}</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <span className={`text-xs px-2 py-1 rounded-full font-medium ${getStatusColor(session.status)}`}>
              {session.status}
            </span>
            {showActions && (
              <Link
                href={`/coaching/${session.conversation_id}`}
                className="p-1 hover:bg-gray-100 rounded transition-colors"
              >
                <ArrowRight className="h-4 w-4 text-gray-400" />
              </Link>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className={`p-3 rounded-lg ${getSessionColor(session.session_type)}`}>
            {getSessionIcon(session.session_type)}
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              {formatSessionType(session.session_type)}
            </h3>
            <p className="text-gray-600 text-sm">
              Session ID: {session.conversation_id.slice(0, 8)}...
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {session.status === 'completed' && (
            <CheckCircle className="h-5 w-5 text-green-500" />
          )}
          {session.status === 'active' && (
            <Play className="h-5 w-5 text-green-500" />
          )}
          <span className={`text-sm px-3 py-1 rounded-full font-medium ${getStatusColor(session.status)}`}>
            {session.status}
          </span>
        </div>
      </div>

      {/* Session Details */}
      <div className="space-y-3 mb-4">
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <Calendar className="h-4 w-4" />
          <span>Started: {formatDate(session.created_at)} at {formatTime(session.created_at)}</span>
        </div>
        
        {session.ended_at && (
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <CheckCircle className="h-4 w-4" />
            <span>Completed: {formatDate(session.ended_at)} at {formatTime(session.ended_at)}</span>
          </div>
        )}

      </div>

      {/* Actions */}
      {showActions && (
        <div className="flex items-center justify-between pt-4 border-t border-gray-200">
          <div className="flex items-center space-x-4">
            {session.status === 'active' && (
              <Link
                href={`/coaching/${session.conversation_id}`}
                className="bg-purple-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-purple-700 transition-colors flex items-center"
              >
                <Play className="h-4 w-4 mr-2" />
                Continue Session
              </Link>
            )}
            
            {session.status === 'completed' && (
              <Link
                href={`/coaching/${session.conversation_id}`}
                className="bg-gray-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-gray-700 transition-colors flex items-center"
              >
                <MessageCircle className="h-4 w-4 mr-2" />
                View Session
              </Link>
            )}
          </div>

          {session.status === 'completed' && onStartSession && (
            <button
              onClick={() => onStartSession(session.session_type)}
              className="text-purple-600 hover:text-purple-700 font-medium text-sm flex items-center"
            >
              Start Similar Session
              <ArrowRight className="h-4 w-4 ml-1" />
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default CoachingCard;