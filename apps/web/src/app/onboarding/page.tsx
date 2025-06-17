'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Brain, Star, Target, CheckCircle, ArrowRight, ArrowLeft, Loader2 } from 'lucide-react';
import apiClient from '@/lib/api';

const onboardingSchema = z.object({
  coaching_goals: z.array(z.string()).min(1, 'Please select at least one coaching goal').max(5, 'Maximum 5 goals allowed'),
  personality_insights_reviewed: z.boolean(),
  initial_session_preferences: z.object({
    preferred_session_length: z.string().optional(),
    communication_style: z.string().optional(),
    focus_areas: z.array(z.string()).optional(),
  }).optional(),
});

type OnboardingFormData = z.infer<typeof onboardingSchema>;

const COACHING_GOALS = [
  'Leadership Development',
  'Communication Skills',
  'Strategic Thinking',
  'Team Management',
  'Decision Making',
  'Emotional Intelligence',
  'Work-Life Balance',
  'Career Advancement',
  'Conflict Resolution',
  'Innovation & Creativity',
  'Time Management',
  'Public Speaking',
];

const SESSION_LENGTHS = [
  { value: '1', label: '1 minute' },
  { value: '3', label: '3 minutes' },
  { value: '5', label: '5 minutes' },
  { value: '30', label: '30 minutes' },
];

const COMMUNICATION_STYLES = [
  { value: 'direct', label: 'Direct & Straightforward' },
  { value: 'collaborative', label: 'Collaborative & Discussion-based' },
  { value: 'reflective', label: 'Reflective & Thoughtful' },
  { value: 'supportive', label: 'Supportive & Encouraging' },
];

export default function OnboardingPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [personalityProfile, setPersonalityProfile] = useState<any>(null);
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);
  
  const { user, refreshUser } = useAuth();
  const router = useRouter();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<OnboardingFormData>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      coaching_goals: [],
      personality_insights_reviewed: false,
      initial_session_preferences: {
        preferred_session_length: '5',
        communication_style: 'collaborative',
        focus_areas: [],
      },
    },
  });

  // Load personality profile on mount
  useEffect(() => {
    const loadPersonalityProfile = async () => {
      try {
        const response = await apiClient.getPersonalityProfile();
        if (response.success) {
          setPersonalityProfile(response.data?.personality_profile);
        }
      } catch (error) {
        console.error('Failed to load personality profile:', error);
      }
    };

    if (user) {
      loadPersonalityProfile();
    }
  }, [user]);

  // Update form when goals change
  useEffect(() => {
    setValue('coaching_goals', selectedGoals);
  }, [selectedGoals, setValue]);

  const toggleGoal = (goal: string) => {
    setSelectedGoals(prev => 
      prev.includes(goal) 
        ? prev.filter(g => g !== goal)
        : prev.length < 5 ? [...prev, goal] : prev
    );
  };

  const onSubmit = async (data: OnboardingFormData) => {
    setIsLoading(true);

    try {
      const response = await apiClient.completeOnboarding({
        coaching_goals: data.coaching_goals,
        personality_insights_reviewed: data.personality_insights_reviewed,
        initial_session_preferences: data.initial_session_preferences,
      });

      if (response.success) {
        await refreshUser();
        router.push('/dashboard');
      } else {
        console.error('Onboarding failed:', response.error);
      }
    } catch (error) {
      console.error('Onboarding error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const nextStep = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <Brain className="h-10 w-10 text-purple-600" />
            <span className="text-3xl font-bold text-gray-900">Agentic Counsel</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome, {user.first_name}!
          </h1>
          <p className="text-lg text-gray-600">
            Let's personalize your coaching experience
          </p>
        </div>

        {/* Progress Bar */}
        <div className="max-w-2xl mx-auto mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-purple-600">Step {currentStep} of 3</span>
            <span className="text-sm text-gray-500">{Math.round((currentStep / 3) * 100)}% Complete</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-purple-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(currentStep / 3) * 100}%` }}
            ></div>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="max-w-2xl mx-auto">
          {/* Step 1: Personality Insights */}
          {currentStep === 1 && (
            <div className="bg-white rounded-xl shadow-lg p-8">
              <div className="text-center mb-6">
                <Star className="h-12 w-12 text-purple-600 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Your Personality Insights
                </h2>
                <p className="text-gray-600">
                  Based on your birth information, we've generated personalized insights
                </p>
              </div>

              {personalityProfile ? (
                <div className="space-y-6">
                  <div className="bg-purple-50 p-6 rounded-lg">
                    <h3 className="text-lg font-semibold text-purple-900 mb-4">
                      Astrological Foundation
                    </h3>
                    <div className="grid md:grid-cols-3 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-purple-600">
                          {personalityProfile.astrological_basis?.sun_sign}
                        </div>
                        <div className="text-sm text-gray-600">Sun Sign</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-purple-600">
                          {personalityProfile.astrological_basis?.moon_sign}
                        </div>
                        <div className="text-sm text-gray-600">Moon Sign</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-purple-600">
                          {personalityProfile.astrological_basis?.rising_sign}
                        </div>
                        <div className="text-sm text-gray-600">Rising Sign</div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-indigo-50 p-6 rounded-lg">
                    <h3 className="text-lg font-semibold text-indigo-900 mb-4">
                      Leadership Traits
                    </h3>
                    <div className="space-y-3">
                      <div>
                        <span className="font-medium text-gray-700">Communication Style:</span>
                        <span className="ml-2 text-gray-600">
                          {personalityProfile.psychological_traits?.communication_style}
                        </span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Decision Making:</span>
                        <span className="ml-2 text-gray-600">
                          {personalityProfile.psychological_traits?.decision_making_pattern}
                        </span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Leadership Tendency:</span>
                        <span className="ml-2 text-gray-600">
                          {personalityProfile.psychological_traits?.leadership_tendency}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <input
                      {...register('personality_insights_reviewed')}
                      type="checkbox"
                      className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                    />
                    <label className="text-sm text-gray-700">
                      I've reviewed my personality insights and understand how they'll be used in coaching
                    </label>
                  </div>
                  {errors.personality_insights_reviewed && (
                    <p className="text-sm text-red-600">Please confirm you've reviewed your insights</p>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-purple-600 mx-auto mb-4" />
                  <p className="text-gray-600">Loading your personality insights...</p>
                </div>
              )}

              <div className="flex justify-end mt-8">
                <button
                  type="button"
                  onClick={nextStep}
                  disabled={!watch('personality_insights_reviewed')}
                  className="bg-purple-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  Next
                  <ArrowRight className="ml-2 h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Coaching Goals */}
          {currentStep === 2 && (
            <div className="bg-white rounded-xl shadow-lg p-8">
              <div className="text-center mb-6">
                <Target className="h-12 w-12 text-purple-600 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Your Coaching Goals
                </h2>
                <p className="text-gray-600">
                  Select up to 5 areas you'd like to focus on (minimum 1 required)
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-3 mb-6">
                {COACHING_GOALS.map((goal) => (
                  <button
                    key={goal}
                    type="button"
                    onClick={() => toggleGoal(goal)}
                    className={`p-4 rounded-lg border-2 text-left transition-all ${
                      selectedGoals.includes(goal)
                        ? 'border-purple-500 bg-purple-50 text-purple-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{goal}</span>
                      {selectedGoals.includes(goal) && (
                        <CheckCircle className="h-5 w-5 text-purple-600" />
                      )}
                    </div>
                  </button>
                ))}
              </div>

              <div className="text-center text-sm text-gray-500 mb-6">
                {selectedGoals.length} of 5 goals selected
              </div>

              {errors.coaching_goals && (
                <p className="text-sm text-red-600 mb-4">{errors.coaching_goals.message}</p>
              )}

              <div className="flex justify-between">
                <button
                  type="button"
                  onClick={prevStep}
                  className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg font-medium hover:bg-gray-300 flex items-center"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back
                </button>
                <button
                  type="button"
                  onClick={nextStep}
                  disabled={selectedGoals.length === 0}
                  className="bg-purple-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  Next
                  <ArrowRight className="ml-2 h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Session Preferences */}
          {currentStep === 3 && (
            <div className="bg-white rounded-xl shadow-lg p-8">
              <div className="text-center mb-6">
                <CheckCircle className="h-12 w-12 text-purple-600 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Session Preferences
                </h2>
                <p className="text-gray-600">
                  Customize your coaching experience
                </p>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Preferred Session Length
                  </label>
                  <div className="grid grid-cols-4 gap-3">
                    {SESSION_LENGTHS.map((length) => (
                      <label key={length.value} className="cursor-pointer">
                        <input
                          {...register('initial_session_preferences.preferred_session_length')}
                          type="radio"
                          value={length.value}
                          className="sr-only"
                        />
                        <div className={`p-3 rounded-lg border-2 text-center transition-all ${
                          watch('initial_session_preferences.preferred_session_length') === length.value
                            ? 'border-purple-500 bg-purple-50 text-purple-700'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}>
                          {length.label}
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Communication Style Preference
                  </label>
                  <div className="space-y-2">
                    {COMMUNICATION_STYLES.map((style) => (
                      <label key={style.value} className="cursor-pointer">
                        <input
                          {...register('initial_session_preferences.communication_style')}
                          type="radio"
                          value={style.value}
                          className="sr-only"
                        />
                        <div className={`p-4 rounded-lg border-2 transition-all ${
                          watch('initial_session_preferences.communication_style') === style.value
                            ? 'border-purple-500 bg-purple-50 text-purple-700'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}>
                          <div className="font-medium">{style.label}</div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex justify-between mt-8">
                <button
                  type="button"
                  onClick={prevStep}
                  className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg font-medium hover:bg-gray-300 flex items-center"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="bg-purple-600 text-white px-8 py-2 rounded-lg font-medium hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  {isLoading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <>
                      Complete Setup
                      <CheckCircle className="ml-2 h-4 w-4" />
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}