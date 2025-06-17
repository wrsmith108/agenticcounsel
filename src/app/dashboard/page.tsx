'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { 
  Brain, 
  MessageCircle, 
  TrendingUp, 
  Target, 
  Calendar,
  Plus,
  ArrowRight,
  Star,
  Clock,
  CheckCircle,
  Loader2
} from 'lucide-react';
import apiClient from '@/lib/api';
import { CoachingSession, ProgressOverview } from '@/types';

export default function DashboardPage() {
  const [recentConversations, setRecentConversations] = useState<CoachingSession[]>([]);
  const [progressOverview, setProgressOverview] = useState<ProgressOverview | null>(null);
  const [loading, setLoading] = useState(true);
  
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    if (user && !user.onboarding_completed) {
      router.push('/onboarding');
      return;
    }

    loadDashboardData();
  }, [isAuthenticated, user, router]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Load recent conversations
      const conversationsResponse = await apiClient.getCoachingConversations(5, 0);
      if (conversationsResponse.success) {
        setRecentConversations(conversationsResponse.data?.conversations || []);
      }

      // Load progress overview
      const progressResponse = await apiClient.getProgressOverview();
      if (progressResponse.success) {
        setProgressOverview(progressResponse.data || null);
      }
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const startNewSession = async (sessionType: string) => {
    try {
      const response = await apiClient.startCoachingSession({
        session_type: sessionType,
      });
      
      if (response.success && response.data?.conversation) {
        router.push(`/coaching/${response.data.conversation.conversation_id}`);
      }
    } catch (error) {
      console.error('Failed to start coaching session:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Brain className="h-8 w-8 text-purple-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Welcome back, {user.first_name}!
                </h1>
                <p className="text-gray-600">Ready to continue your growth journey?</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                href="/progress"
                className="text-gray-600 hover:text-gray-900 font-medium"
              >
                Progress
              </Link>
              <button
                onClick={() => startNewSession('coaching_conversation')}
                className="bg-purple-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-purple-700 transition-colors flex items-center"
              >
                <Plus className="h-4 w-4 mr-2" />
                New Session
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Quick Actions */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <button
            onClick={() => startNewSession('coaching_conversation')}
            className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow border border-gray-200 text-left"
          >
            <MessageCircle className="h-8 w-8 text-purple-600 mb-3" />
            <h3 className="font-semibold text-gray-900 mb-1">Start Coaching</h3>
            <p className="text-sm text-gray-600">Begin a new coaching conversation</p>
          </button>

          <button
            onClick={() => startNewSession('progress_review')}
            className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow border border-gray-200 text-left"
          >
            <TrendingUp className="h-8 w-8 text-green-600 mb-3" />
            <h3 className="font-semibold text-gray-900 mb-1">Review Progress</h3>
            <p className="text-sm text-gray-600">Assess your recent achievements</p>
          </button>

          <button
            onClick={() => startNewSession('goal_setting')}
            className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow border border-gray-200 text-left"
          >
            <Target className="h-8 w-8 text-blue-600 mb-3" />
            <h3 className="font-semibold text-gray-900 mb-1">Set Goals</h3>
            <p className="text-sm text-gray-600">Define new objectives</p>
          </button>

          <button
            onClick={() => startNewSession('action_planning')}
            className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow border border-gray-200 text-left"
          >
            <Calendar className="h-8 w-8 text-orange-600 mb-3" />
            <h3 className="font-semibold text-gray-900 mb-1">Plan Actions</h3>
            <p className="text-sm text-gray-600">Create actionable steps</p>
          </button>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Progress Overview */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Progress Overview</h2>
                <Link
                  href="/progress"
                  className="text-purple-600 hover:text-purple-700 font-medium flex items-center"
                >
                  View Details
                  <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </div>

              {progressOverview ? (
                <div className="space-y-6">
                  {/* Progress Stats */}
                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="bg-purple-50 p-4 rounded-lg">
                      <div className="text-2xl font-bold text-purple-600">
                        {progressOverview.average_progress}%
                      </div>
                      <div className="text-sm text-gray-600">Average Progress</div>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">
                        {progressOverview.completed_milestones}
                      </div>
                      <div className="text-sm text-gray-600">Milestones Completed</div>
                    </div>
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">
                        {progressOverview.total_goals}
                      </div>
                      <div className="text-sm text-gray-600">Active Goals</div>
                    </div>
                  </div>

                  {/* Progress by Category */}
                  <div>
                    <h3 className="font-medium text-gray-900 mb-3">Goals Progress</h3>
                    <div className="space-y-3">
                      {progressOverview.progress_by_category.slice(0, 3).map((category, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm font-medium text-gray-700">
                                {category.goal_category}
                              </span>
                              <span className="text-sm text-gray-500">
                                {category.completion_percentage}%
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-purple-600 h-2 rounded-full"
                                style={{ width: `${category.completion_percentage}%` }}
                              ></div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 mb-4">No progress data yet</p>
                  <button
                    onClick={() => startNewSession('goal_setting')}
                    className="bg-purple-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-purple-700"
                  >
                    Set Your First Goal
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Recent Conversations */}
          <div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Recent Sessions</h2>
                <Link
                  href="/coaching"
                  className="text-purple-600 hover:text-purple-700 font-medium flex items-center"
                >
                  View All
                  <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </div>

              {recentConversations.length > 0 ? (
                <div className="space-y-4">
                  {recentConversations.map((conversation) => (
                    <Link
                      key={conversation.conversation_id}
                      href={`/coaching/${conversation.conversation_id}`}
                      className="block p-4 border border-gray-200 rounded-lg hover:border-purple-300 hover:bg-purple-50 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-gray-900 capitalize">
                          {conversation.session_type.replace('_', ' ')}
                        </span>
                        <div className="flex items-center space-x-2">
                          {conversation.status === 'completed' && (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          )}
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            conversation.status === 'active' 
                              ? 'bg-green-100 text-green-700'
                              : 'bg-gray-100 text-gray-700'
                          }`}>
                            {conversation.status}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center text-sm text-gray-500">
                        <Clock className="h-4 w-4 mr-1" />
                        {new Date(conversation.created_at).toLocaleDateString()}
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 mb-4">No coaching sessions yet</p>
                  <button
                    onClick={() => startNewSession('initial_insights')}
                    className="bg-purple-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-purple-700"
                  >
                    Start Your First Session
                  </button>
                </div>
              )}
            </div>

            {/* Coaching Goals */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mt-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Your Goals</h2>
              {user.coaching_goals && user.coaching_goals.length > 0 ? (
                <div className="space-y-2">
                  {user.coaching_goals.slice(0, 4).map((goal, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <Star className="h-4 w-4 text-purple-600" />
                      <span className="text-sm text-gray-700">{goal}</span>
                    </div>
                  ))}
                  {user.coaching_goals.length > 4 && (
                    <p className="text-sm text-gray-500 mt-2">
                      +{user.coaching_goals.length - 4} more goals
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-gray-600 text-sm">No goals set yet</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}