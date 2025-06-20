'use client';

import React from 'react';
import { Star, Lock, Calendar, Clock, MapPin, ArrowRight } from 'lucide-react';

interface TieredNatalChartProps {
  natalChart?: any;
  profileTier: number;
  onEnhance?: () => void;
  className?: string;
}

export default function TieredNatalChart({ 
  natalChart, 
  profileTier, 
  onEnhance,
  className = '' 
}: TieredNatalChartProps) {
  
  const renderTier1EmptyState = () => (
    <div className={`bg-white rounded-lg border-2 border-dashed border-gray-300 p-8 text-center ${className}`}>
      <div className="max-w-md mx-auto">
        <Star className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          Unlock Your Cosmic Blueprint
        </h3>
        <p className="text-gray-600 mb-6">
          Add your birth details to reveal personalized astrological insights and enhance your coaching experience.
        </p>
        
        <div className="space-y-3 mb-6">
          <div className="flex items-center justify-center text-sm text-gray-500">
            <Calendar className="h-4 w-4 mr-2" />
            <span>Birth date unlocks Sun & Moon signs</span>
          </div>
          <div className="flex items-center justify-center text-sm text-gray-500">
            <Clock className="h-4 w-4 mr-2" />
            <span>Birth time reveals your Rising sign</span>
          </div>
          <div className="flex items-center justify-center text-sm text-gray-500">
            <MapPin className="h-4 w-4 mr-2" />
            <span>Birth location completes your chart</span>
          </div>
        </div>

        <button
          onClick={onEnhance}
          className="bg-purple-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-purple-700 transition-colors inline-flex items-center space-x-2"
        >
          <span>Add Birth Details</span>
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );

  const renderTier2PartialChart = () => (
    <div className={`bg-white rounded-lg border border-gray-200 shadow-sm ${className}`}>
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Your Astrological Profile</h2>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
            <span className="text-sm text-gray-600">Partial Chart</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Available components */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
              Available Insights
            </h3>
            
            {natalChart?.planetary_positions?.find((p: any) => p.body === 'Sun') && (
              <div className="bg-yellow-50 p-4 rounded-lg">
                <div className="flex items-center mb-2">
                  <span className="text-2xl mr-3">☀️</span>
                  <div>
                    <h4 className="font-medium text-gray-900">Sun Sign</h4>
                    <p className="text-sm text-gray-600">
                      {natalChart.planetary_positions.find((p: any) => p.body === 'Sun')?.zodiac_sign} 
                      {' '}
                      {natalChart.planetary_positions.find((p: any) => p.body === 'Sun')?.degree_in_sign.toFixed(0)}°
                    </p>
                  </div>
                </div>
              </div>
            )}

            {natalChart?.planetary_positions?.find((p: any) => p.body === 'Moon') && (
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-center mb-2">
                  <span className="text-2xl mr-3">🌙</span>
                  <div>
                    <h4 className="font-medium text-gray-900">Moon Sign</h4>
                    <p className="text-sm text-gray-600">
                      {natalChart.planetary_positions.find((p: any) => p.body === 'Moon')?.zodiac_sign}
                      {' '}
                      {natalChart.planetary_positions.find((p: any) => p.body === 'Moon')?.degree_in_sign.toFixed(0)}°
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Locked components */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              <Lock className="w-4 h-4 mr-2 text-gray-400" />
              Unlock with Birth Time & Location
            </h3>
            
            <div className="bg-gray-50 p-4 rounded-lg border-2 border-dashed border-gray-300">
              <div className="flex items-center mb-2">
                <span className="text-2xl mr-3 opacity-50">⬆️</span>
                <div>
                  <h4 className="font-medium text-gray-500">Rising Sign</h4>
                  <p className="text-sm text-gray-400">Requires birth time & location</p>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg border-2 border-dashed border-gray-300">
              <div className="flex items-center mb-2">
                <span className="text-2xl mr-3 opacity-50">🏠</span>
                <div>
                  <h4 className="font-medium text-gray-500">Houses</h4>
                  <p className="text-sm text-gray-400">Complete chart required</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Enhancement prompt */}
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <Star className="h-5 w-5 text-purple-600 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-medium text-purple-900 mb-1">
                Unlock Your Complete Chart
              </h4>
              <p className="text-sm text-purple-700 mb-3">
                Add your birth time and location to reveal your rising sign, house placements, and aspects. This increases accuracy from 60% to 85%.
              </p>
              <button
                onClick={onEnhance}
                className="bg-purple-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-purple-700 transition-colors inline-flex items-center space-x-2"
              >
                <span>Complete Chart</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderTier3CompleteChart = () => (
    <div className={`bg-white rounded-lg border border-gray-200 shadow-sm ${className}`}>
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Complete Birth Chart</h2>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-sm text-gray-600">Full Chart</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Sun */}
          {natalChart?.planetary_positions?.find((p: any) => p.body === 'Sun') && (
            <div className="bg-yellow-50 p-4 rounded-lg">
              <div className="flex items-center mb-2">
                <span className="text-2xl mr-3">☀️</span>
                <div>
                  <h4 className="font-medium text-gray-900">Sun</h4>
                  <p className="text-sm text-gray-600">
                    {natalChart.planetary_positions.find((p: any) => p.body === 'Sun')?.zodiac_sign} 
                    {' '}
                    {natalChart.planetary_positions.find((p: any) => p.body === 'Sun')?.degree_in_sign.toFixed(1)}°
                    {natalChart.planetary_positions.find((p: any) => p.body === 'Sun')?.house && 
                      ` (${natalChart.planetary_positions.find((p: any) => p.body === 'Sun')?.house}th house)`
                    }
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Moon */}
          {natalChart?.planetary_positions?.find((p: any) => p.body === 'Moon') && (
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-center mb-2">
                <span className="text-2xl mr-3">🌙</span>
                <div>
                  <h4 className="font-medium text-gray-900">Moon</h4>
                  <p className="text-sm text-gray-600">
                    {natalChart.planetary_positions.find((p: any) => p.body === 'Moon')?.zodiac_sign}
                    {' '}
                    {natalChart.planetary_positions.find((p: any) => p.body === 'Moon')?.degree_in_sign.toFixed(1)}°
                    {natalChart.planetary_positions.find((p: any) => p.body === 'Moon')?.house && 
                      ` (${natalChart.planetary_positions.find((p: any) => p.body === 'Moon')?.house}th house)`
                    }
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Rising */}
          {natalChart?.rising_sign && (
            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="flex items-center mb-2">
                <span className="text-2xl mr-3">⬆️</span>
                <div>
                  <h4 className="font-medium text-gray-900">Rising</h4>
                  <p className="text-sm text-gray-600">
                    {natalChart.rising_sign.sign} {natalChart.rising_sign.degree.toFixed(1)}°
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Additional planetary positions */}
        {natalChart?.planetary_positions && natalChart.planetary_positions.length > 2 && (
          <div className="mt-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Other Planetary Positions</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {natalChart.planetary_positions
                .filter((p: any) => p.body !== 'Sun' && p.body !== 'Moon')
                .map((planet: any, index: number) => (
                  <div key={index} className="bg-gray-50 p-3 rounded-lg">
                    <h4 className="font-medium text-gray-900 text-sm">{planet.body}</h4>
                    <p className="text-xs text-gray-600">
                      {planet.zodiac_sign} {planet.degree_in_sign.toFixed(1)}°
                      {planet.house && ` (${planet.house}th)`}
                    </p>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Houses */}
        {natalChart?.house_cusps && natalChart.house_cusps.length > 0 && (
          <div className="mt-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">House Cusps</h3>
            <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {natalChart.house_cusps.map((house: any, index: number) => (
                <div key={index} className="bg-indigo-50 p-3 rounded-lg text-center">
                  <h4 className="font-medium text-indigo-900 text-sm">{house.house_number}</h4>
                  <p className="text-xs text-indigo-700">
                    {house.sign} {house.degree.toFixed(1)}°
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  // Render based on tier
  switch (profileTier) {
    case 1:
      return renderTier1EmptyState();
    case 2:
      return renderTier2PartialChart();
    case 3:
      return renderTier3CompleteChart();
    default:
      return renderTier1EmptyState();
  }
}