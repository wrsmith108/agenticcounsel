'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { 
  Star,
  Plus,
  Edit,
  Trash2,
  AlertCircle,
  CheckCircle,
  ArrowLeft
} from 'lucide-react';
import apiClient from '@/lib/api';
import { NatalChart, CreateNatalChartRequest } from '@/types';
import NatalChartForm from '@/components/NatalChartForm';
import NatalChartDisplay from '@/components/NatalChartDisplay';
import LoadingSpinner from '@/components/LoadingSpinner';

export default function AstrologyPage() {
  const [natalChart, setNatalChart] = useState<NatalChart | null>(null);
  const [loading, setLoading] = useState(true);
  const [formLoading, setFormLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
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

    loadNatalChart();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, user, router]);

  const loadNatalChart = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      setError('');
      
      const response = await apiClient.getNatalChart(user.user_id);
      if (response.success && response.data) {
        setNatalChart(response.data);
        setShowForm(false);
      } else {
        // No chart exists yet, show form
        setShowForm(true);
      }
    } catch (err: unknown) {
      console.error('Failed to load natal chart:', err);
      const error = err as { response?: { status?: number } };
      if (error.response?.status === 404) {
        // Chart doesn't exist, show form
        setShowForm(true);
      } else {
        setError('Failed to load natal chart. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateChart = async (birthData: CreateNatalChartRequest) => {
    if (!user) return;
    
    try {
      setFormLoading(true);
      setError('');
      setSuccess('');

      let response;
      if (isEditing && natalChart) {
        // Update existing chart
        response = await apiClient.updateNatalChart(natalChart.chart_id, birthData);
        if (response.success) {
          setSuccess('Natal chart updated successfully!');
          // Reload the chart data
          await loadNatalChart();
        }
      } else {
        // Create new chart
        response = await apiClient.generateNatalChart(birthData);
        if (response.success && response.data) {
          setNatalChart(response.data);
          setSuccess('Natal chart generated successfully!');
          setShowForm(false);
        }
      }

      if (!response.success) {
        setError(response.error?.message || 'Failed to generate natal chart. Please try again.');
      }
    } catch (err: unknown) {
      console.error('Failed to generate natal chart:', err);
      const error = err as { response?: { data?: { error?: { message?: string } } } };
      setError(error.response?.data?.error?.message || 'Failed to generate natal chart. Please try again.');
    } finally {
      setFormLoading(false);
      setIsEditing(false);
    }
  };

  const handleEditChart = () => {
    setIsEditing(true);
    setShowForm(true);
    setError('');
    setSuccess('');
  };

  const handleDeleteChart = async () => {
    if (!natalChart || !window.confirm('Are you sure you want to delete your natal chart? This action cannot be undone.')) {
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      const response = await apiClient.deleteNatalChart(natalChart.chart_id);
      if (response.success) {
        setNatalChart(null);
        setShowForm(true);
        setSuccess('Natal chart deleted successfully.');
      } else {
        setError('Failed to delete natal chart. Please try again.');
      }
    } catch (err: unknown) {
      console.error('Failed to delete natal chart:', err);
      setError('Failed to delete natal chart. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setShowForm(false);
    setError('');
    setSuccess('');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="xl" text="Loading your natal chart..." variant="branded" />
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
              <button
                onClick={() => router.push('/dashboard')}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 font-medium"
              >
                <ArrowLeft className="h-5 w-5" />
                <span>Back to Dashboard</span>
              </button>
              <div className="h-6 w-px bg-gray-300"></div>
              <Star className="h-8 w-8 text-purple-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Astrology</h1>
                <p className="text-gray-600">Your personalized natal chart</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {natalChart && !showForm && (
                <>
                  <button
                    onClick={handleEditChart}
                    className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 font-medium"
                  >
                    <Edit className="h-4 w-4" />
                    <span>Edit Chart</span>
                  </button>
                  <button
                    onClick={handleDeleteChart}
                    className="flex items-center space-x-2 text-red-600 hover:text-red-700 font-medium"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span>Delete</span>
                  </button>
                </>
              )}
              {!natalChart && !showForm && (
                <button
                  onClick={() => setShowForm(true)}
                  className="bg-purple-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-purple-700 transition-colors flex items-center"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Chart
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Success/Error Messages */}
        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-md p-4">
            <div className="flex items-center">
              <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
              <p className="text-sm text-green-700">{success}</p>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
              <p className="text-sm text-red-600">{error}</p>
            </div>
          </div>
        )}

        {/* Main Content */}
        {showForm ? (
          <div className="max-w-2xl mx-auto">
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                {isEditing ? 'Update Your Natal Chart' : 'Create Your Natal Chart'}
              </h2>
              <p className="text-gray-600">
                {isEditing 
                  ? 'Modify your birth information to update your natal chart.'
                  : 'Enter your birth information to generate your personalized natal chart.'
                }
              </p>
            </div>

            <NatalChartForm
              onSubmit={handleGenerateChart}
              initialData={isEditing && natalChart ? {
                birth_date: natalChart.birth_data.birth_date,
                birth_time: natalChart.birth_data.birth_time,
                birth_location: natalChart.birth_data.birth_location,
              } : undefined}
              isLoading={formLoading}
              submitButtonText={isEditing ? 'Update Natal Chart' : 'Generate Natal Chart'}
            />

            {isEditing && (
              <div className="mt-4 flex justify-center">
                <button
                  onClick={handleCancelEdit}
                  className="text-gray-600 hover:text-gray-900 font-medium"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        ) : natalChart ? (
          <div className="max-w-6xl mx-auto">
            <NatalChartDisplay chart={natalChart} />
          </div>
        ) : (
          <div className="max-w-2xl mx-auto text-center py-12">
            <Star className="h-16 w-16 text-gray-400 mx-auto mb-6" />
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              No Natal Chart Yet
            </h2>
            <p className="text-gray-600 mb-8">
              Create your personalized natal chart to unlock astrological insights about your personality and life path.
            </p>
            <button
              onClick={() => setShowForm(true)}
              className="bg-purple-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-purple-700 transition-colors flex items-center mx-auto"
            >
              <Plus className="h-5 w-5 mr-2" />
              Create Your Natal Chart
            </button>
          </div>
        )}
      </div>
    </div>
  );
}