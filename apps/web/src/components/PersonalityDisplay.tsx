'use client';

import React from 'react';
import { Brain, Star, TrendingUp, Users, Lightbulb, Target } from 'lucide-react';
import { PersonalityProfile } from '@/types';

interface PersonalityDisplayProps {
  profile: PersonalityProfile;
  compact?: boolean;
}

const PersonalityDisplay: React.FC<PersonalityDisplayProps> = ({ profile, compact = false }) => {
  const getTraitIcon = (trait: string) => {
    switch (trait.toLowerCase()) {
      case 'leadership':
        return <Users className="h-4 w-4" />;
      case 'creativity':
        return <Lightbulb className="h-4 w-4" />;
      case 'analytical':
        return <TrendingUp className="h-4 w-4" />;
      case 'goal-oriented':
        return <Target className="h-4 w-4" />;
      default:
        return <Star className="h-4 w-4" />;
    }
  };

  const getTraitColor = (trait: string) => {
    switch (trait.toLowerCase()) {
      case 'leadership':
        return 'text-blue-600 bg-blue-50';
      case 'creativity':
        return 'text-purple-600 bg-purple-50';
      case 'analytical':
        return 'text-green-600 bg-green-50';
      case 'goal-oriented':
        return 'text-orange-600 bg-orange-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  if (compact) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center space-x-2 mb-3">
          <Brain className="h-5 w-5 text-purple-600" />
          <h3 className="font-medium text-gray-900">Personality Profile</h3>
        </div>
        
        <div className="space-y-2">
          <div>
            <span className="text-sm font-medium text-gray-600">Primary Type:</span>
            <span className="ml-2 text-sm text-gray-900">{profile.primary_type}</span>
          </div>
          
          {profile.key_traits && profile.key_traits.length > 0 && (
            <div>
              <span className="text-sm font-medium text-gray-600">Key Traits:</span>
              <div className="flex flex-wrap gap-1 mt-1">
                {profile.key_traits.slice(0, 3).map((trait, index) => (
                  <span
                    key={index}
                    className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getTraitColor(trait)}`}
                  >
                    {getTraitIcon(trait)}
                    <span className="ml-1">{trait}</span>
                  </span>
                ))}
                {profile.key_traits.length > 3 && (
                  <span className="text-xs text-gray-500">+{profile.key_traits.length - 3} more</span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center space-x-3 mb-6">
        <div className="p-2 bg-purple-100 rounded-lg">
          <Brain className="h-6 w-6 text-purple-600" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Personality Profile</h2>
          <p className="text-gray-600">Based on your birth data and preferences</p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Primary Type */}
        <div>
          <h3 className="font-medium text-gray-900 mb-2">Primary Type</h3>
          <div className="bg-purple-50 rounded-lg p-4">
            <div className="text-lg font-semibold text-purple-900 mb-2">
              {profile.primary_type}
            </div>
            {profile.description && (
              <p className="text-purple-700 text-sm leading-relaxed">
                {profile.description}
              </p>
            )}
          </div>
        </div>

        {/* Key Traits */}
        {profile.key_traits && profile.key_traits.length > 0 && (
          <div>
            <h3 className="font-medium text-gray-900 mb-3">Key Traits</h3>
            <div className="grid grid-cols-2 gap-3">
              {profile.key_traits.map((trait, index) => (
                <div
                  key={index}
                  className={`flex items-center space-x-2 p-3 rounded-lg ${getTraitColor(trait)}`}
                >
                  {getTraitIcon(trait)}
                  <span className="font-medium">{trait}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Strengths */}
        {profile.strengths && profile.strengths.length > 0 && (
          <div>
            <h3 className="font-medium text-gray-900 mb-3">Strengths</h3>
            <div className="space-y-2">
              {profile.strengths.map((strength, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <Star className="h-4 w-4 text-yellow-500" />
                  <span className="text-gray-700">{strength}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Growth Areas */}
        {profile.growth_areas && profile.growth_areas.length > 0 && (
          <div>
            <h3 className="font-medium text-gray-900 mb-3">Growth Areas</h3>
            <div className="space-y-2">
              {profile.growth_areas.map((area, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <TrendingUp className="h-4 w-4 text-green-500" />
                  <span className="text-gray-700">{area}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Coaching Recommendations */}
        {profile.coaching_recommendations && profile.coaching_recommendations.length > 0 && (
          <div>
            <h3 className="font-medium text-gray-900 mb-3">Coaching Recommendations</h3>
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="space-y-2">
                {profile.coaching_recommendations.map((recommendation, index) => (
                  <div key={index} className="flex items-start space-x-2">
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
                    <span className="text-blue-800 text-sm">{recommendation}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Metadata */}
        <div className="pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between text-sm text-gray-500">
            <span>Profile created: {new Date(profile.created_at).toLocaleDateString()}</span>
            {profile.confidence_score && (
              <span>Confidence: {Math.round(profile.confidence_score * 100)}%</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PersonalityDisplay;