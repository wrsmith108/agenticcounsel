'use client';

import React, { useState, useEffect } from 'react';
import { Star, Calendar, Clock, MapPin, ArrowRight, X } from 'lucide-react';
import apiClient from '@/lib/api';

interface CompletionStatus {
  current_tier: number;
  completion_percentage: number;
  available_components: string[];
  missing_components: string[];
  next_upgrade: string | null;
  enhancement_benefits: string[];
}

interface ProfileCompletionWidgetProps {
  className?: string;
  compact?: boolean;
  onEnhance?: () => void;
}

export default function ProfileCompletionWidget({ 
  className = '', 
  compact = false,
  onEnhance 
}: ProfileCompletionWidgetProps) {
  const [status, setStatus] = useState<CompletionStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    loadCompletionStatus();
  }, []);

  const loadCompletionStatus = async () => {
    try {
      const response = await apiClient.get('/api/user-enhancement/completion-status');
      if (response.success) {
        setStatus(response.data);
      }
    } catch (error) {
      console.error('Failed to load completion status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEnhanceClick = () => {
    if (onEnhance) {
      onEnhance();
    } else {
      // Default behavior - open enhancement modal or navigate
      console.log('Opening enhancement flow...');
    }
  };

  if (loading) {
    return (
      <div className={`bg-white rounded-lg border border-gray-200 p-4 ${className}`}>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
          <div className="h-2 bg-gray-200 rounded w-full mb-4"></div>
          <div className="h-8 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  if (!status || status.current_tier === 3 || dismissed) {
    return null; // Don't show if complete or dismissed
  }

  if (compact) {
    return (
      <div className={`bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg border border-purple-200 p-3 ${className}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Star className="h-4 w-4 text-purple-600" />
            <span className="text-sm font-medium text-purple-900">
              Profile {status.completion_percentage}% complete
            </span>
          </div>
          <button
            onClick={handleEnhanceClick}
            className="text-xs bg-purple-600 text-white px-2 py-1 rounded-md hover:bg-purple-700 transition-colors"
          >
            Enhance
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg border border-purple-200 shadow-sm ${className}`}>
      {/* Dismissible header */}
      <div className="flex items-center justify-between p-4 border-b border-purple-100">
        <div className="flex items-center space-x-2">
          <Star className="h-5 w-5 text-purple-600" />
          <h3 className="text-lg font-semibold text-purple-900">
            Unlock Your Full Potential
          </h3>
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="p-4">
        {/* Progress bar */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">
              Profile Insights: {status.completion_percentage}% Complete
            </span>
            <span className="text-sm text-purple-600">
              Tier {status.current_tier} of 3
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-purple-600 to-indigo-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${status.completion_percentage}%` }}
            ></div>
          </div>
        </div>

        {/* Available features */}
        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-900 mb-2">✅ Unlocked Features:</h4>
          <div className="space-y-1">
            {status.available_components.map((component, index) => (
              <div key={index} className="text-sm text-gray-600 flex items-center">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                {component}
              </div>
            ))}
          </div>
        </div>

        {/* Missing components */}
        {status.missing_components.length > 0 && (
          <div className="mb-4">
            <h4 className="text-sm font-medium text-gray-900 mb-2">🔒 Missing Data:</h4>
            <div className="grid grid-cols-1 gap-2">
              {status.missing_components.map((component, index) => (
                <div key={index} className="flex items-center text-sm text-gray-500">
                  {component === 'Birth Date' && <Calendar className="h-4 w-4 mr-2" />}
                  {component === 'Birth Time' && <Clock className="h-4 w-4 mr-2" />}
                  {component === 'Birth Location' && <MapPin className="h-4 w-4 mr-2" />}
                  <span>{component}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Enhancement benefits */}
        {status.enhancement_benefits.length > 0 && (
          <div className="mb-4">
            <h4 className="text-sm font-medium text-gray-900 mb-2">🌟 Next Level Benefits:</h4>
            <div className="space-y-1">
              {status.enhancement_benefits.map((benefit, index) => (
                <div key={index} className="text-sm text-purple-700 flex items-start">
                  <span className="w-1.5 h-1.5 bg-purple-500 rounded-full mr-2 mt-2 flex-shrink-0"></span>
                  {benefit}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Next upgrade description */}
        {status.next_upgrade && (
          <div className="mb-4 p-3 bg-purple-50 rounded-lg">
            <p className="text-sm text-purple-800">{status.next_upgrade}</p>
          </div>
        )}

        {/* Action button */}
        <button
          onClick={handleEnhanceClick}
          className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-2 px-4 rounded-lg font-medium hover:from-purple-700 hover:to-indigo-700 transition-all duration-200 flex items-center justify-center space-x-2"
        >
          <span>Enhance Profile</span>
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}