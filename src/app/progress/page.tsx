'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { 
  TrendingUp, 
  Target, 
  Calendar,
  ArrowLeft,
  CheckCircle,
  Clock,
  Star,
  BarChart3,
  PieChart,
  Loader2
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart as RechartsPieChart, Cell, Pie } from 'recharts';
import apiClient from '@/lib/api';
import { ProgressOverview, ProgressEntry } from '@/types';

const COLORS = ['#8B5CF6', '#10B981', '#F59E0B', '#EF4444', '#3B82F6'];

export default function ProgressPage() {
  const [progressOverview, setProgressOverview] = useState<ProgressOverview | null>(null);
  const [progressHistory, setProgressHistory] = useState<ProgressEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'quarter'>('month');
  
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    loadProgressData();
  }, [isAuthenticated, router, timeRange]);

  const loadProgressData = async () => {
    try {
      setLoading(true);
      
      // Load progress overview
      const overviewResponse = await apiClient.getProgressOverview();
      if (overviewResponse.success) {
        setProgressOverview(overviewResponse.data || null);
      }

      // Load progress history
      const historyResponse = await apiClient.getProgressHistory(timeRange);
      if (historyResponse.success) {
        setProgressHistory(historyResponse.data || []);
      }
    } catch (error) {
      console.error('Failed to load progress data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatChartData = () => {
    if (!progressHistory.length) return [];
    
    return progressHistory.map(entry => ({
      date: new Date(entry.recorded_at).toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      }),
      progress: entry.progress_percentage,
      goal: entry.goal_category
    }));
  };

  const getCategoryData = () => {
    if (!progressOverview) return [];
    
    return progressOverview.progress_by_category.map((category, index) => ({
      name: category.goal_category,
      value: category.completion_percentage,
      color: COLORS[index % COLORS.length]
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link
                href="/dashboard"
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="h-5 w-5 text-gray-600" />
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Progress Tracking</h1>
                <p className="text-gray-600">Monitor your coaching journey and achievements</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value as 'week' | 'month' | 'quarter')}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="week">Last Week</option>
                <option value="month">Last Month</option>
                <option value="quarter">Last Quarter</option>
              </select>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {progressOverview ? (
          <>
            {/* Overview Stats */}
            <div className="grid md:grid-cols-4 gap-6 mb-8">
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Average Progress</p>
                    <p className="text-2xl font-bold text-purple-600">
                      {progressOverview.average_progress}%
                    </p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-purple-600" />
                </div>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Completed Milestones</p>
                    <p className="text-2xl font-bold text-green-600">
                      {progressOverview.completed_milestones}
                    </p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Active Goals</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {progressOverview.total_goals}
                    </p>
                  </div>
                  <Target className="h-8 w-8 text-blue-600" />
                </div>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Days Active</p>
                    <p className="text-2xl font-bold text-orange-600">
                      {Math.floor((Date.now() - new Date(user?.created_at || '').getTime()) / (1000 * 60 * 60 * 24))}
                    </p>
                  </div>
                  <Calendar className="h-8 w-8 text-orange-600" />
                </div>
              </div>
            </div>

            <div className="grid lg:grid-cols-2 gap-8 mb-8">
              {/* Progress Over Time */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-gray-900">Progress Over Time</h2>
                  <BarChart3 className="h-5 w-5 text-gray-400" />
                </div>
                
                {formatChartData().length > 0 ? (
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={formatChartData()}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis domain={[0, 100]} />
                        <Tooltip 
                          formatter={(value) => [`${value}%`, 'Progress']}
                          labelFormatter={(label) => `Date: ${label}`}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="progress" 
                          stroke="#8B5CF6" 
                          strokeWidth={2}
                          dot={{ fill: '#8B5CF6', strokeWidth: 2, r: 4 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-64 flex items-center justify-center text-gray-500">
                    <div className="text-center">
                      <BarChart3 className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p>No progress data available for this time range</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Progress by Category */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-gray-900">Progress by Category</h2>
                  <PieChart className="h-5 w-5 text-gray-400" />
                </div>
                
                {getCategoryData().length > 0 ? (
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsPieChart>
                        <Pie
                          data={getCategoryData()}
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          dataKey="value"
                          label={({ name, value }) => `${name}: ${value}%`}
                        >
                          {getCategoryData().map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => `${value}%`} />
                      </RechartsPieChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-64 flex items-center justify-center text-gray-500">
                    <div className="text-center">
                      <PieChart className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p>No category data available</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Goals Progress */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Goals Progress</h2>
              
              {progressOverview.progress_by_category.length > 0 ? (
                <div className="space-y-6">
                  {progressOverview.progress_by_category.map((category, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-medium text-gray-900 flex items-center">
                          <Star className="h-4 w-4 text-purple-600 mr-2" />
                          {category.goal_category}
                        </h3>
                        <span className="text-sm font-medium text-gray-600">
                          {category.completion_percentage}% Complete
                        </span>
                      </div>
                      
                      <div className="w-full bg-gray-200 rounded-full h-3 mb-3">
                        <div
                          className="bg-purple-600 h-3 rounded-full transition-all duration-300"
                          style={{ width: `${category.completion_percentage}%` }}
                        ></div>
                      </div>
                      
                      <div className="flex items-center justify-between text-sm text-gray-500">
                        <span>Started {new Date(category.created_at).toLocaleDateString()}</span>
                        <span>
                          {category.completion_percentage === 100 ? (
                            <span className="text-green-600 font-medium">Completed!</span>
                          ) : (
                            <span>{100 - category.completion_percentage}% remaining</span>
                          )}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 mb-4">No goals set yet</p>
                  <Link
                    href="/dashboard"
                    className="bg-purple-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-purple-700 inline-flex items-center"
                  >
                    <Target className="h-4 w-4 mr-2" />
                    Set Your First Goal
                  </Link>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="text-center py-12">
            <TrendingUp className="h-16 w-16 text-gray-400 mx-auto mb-6" />
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">No Progress Data Yet</h2>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              Start your coaching journey to begin tracking your progress and achievements.
            </p>
            <Link
              href="/dashboard"
              className="bg-purple-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-purple-700 inline-flex items-center"
            >
              <Target className="h-5 w-5 mr-2" />
              Start Coaching
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}