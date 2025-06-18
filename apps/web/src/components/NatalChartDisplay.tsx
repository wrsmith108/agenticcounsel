'use client';

import React, { useState } from 'react';
import { 
  Sun, 
  Moon, 
  Star, 
  Home, 
  Zap, 
  RotateCcw, 
  ChevronDown, 
  ChevronUp,
  Calendar,
  MapPin,
  Clock
} from 'lucide-react';
import { NatalChart, CelestialBody } from '@/types';

interface NatalChartDisplayProps {
  chart: NatalChart;
}

// Icon mapping for celestial bodies
const CELESTIAL_BODY_ICONS: Record<CelestialBody, React.ReactNode> = {
  'Sun': <Sun className="h-4 w-4 text-yellow-500" />,
  'Moon': <Moon className="h-4 w-4 text-blue-400" />,
  'Mercury': <Star className="h-4 w-4 text-gray-500" />,
  'Venus': <Star className="h-4 w-4 text-pink-500" />,
  'Mars': <Star className="h-4 w-4 text-red-500" />,
  'Jupiter': <Star className="h-4 w-4 text-orange-500" />,
  'Saturn': <Star className="h-4 w-4 text-gray-700" />,
  'Uranus': <Star className="h-4 w-4 text-cyan-500" />,
  'Neptune': <Star className="h-4 w-4 text-blue-600" />,
  'Pluto': <Star className="h-4 w-4 text-purple-600" />,
  'Ascendant': <Zap className="h-4 w-4 text-green-500" />,
  'Midheaven': <Home className="h-4 w-4 text-indigo-500" />,
  'North Node': <Star className="h-4 w-4 text-emerald-500" />,
  'South Node': <Star className="h-4 w-4 text-amber-600" />,
  'Lilith': <Star className="h-4 w-4 text-violet-600" />,
};

// Color mapping for aspect types
const ASPECT_COLORS: Record<string, string> = {
  'conjunction': 'text-red-600',
  'opposition': 'text-red-500',
  'square': 'text-orange-500',
  'trine': 'text-green-500',
  'sextile': 'text-blue-500',
  'quincunx': 'text-purple-500',
  'semisquare': 'text-yellow-600',
  'sesquiquadrate': 'text-pink-500',
};

export default function NatalChartDisplay({ chart }: NatalChartDisplayProps) {
  const [activeTab, setActiveTab] = useState<'summary' | 'planets' | 'houses' | 'aspects'>('summary');
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    summary: true,
    planets: true,
    houses: true,
    aspects: true,
  });

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const formatDegree = (degree: number) => {
    const deg = Math.floor(degree);
    const min = Math.floor((degree - deg) * 60);
    return `${deg}°${min.toString().padStart(2, '0')}'`;
  };

  const getChartSummary = () => {
    const sun = chart.planetary_positions.find(p => p.celestial_body === 'Sun');
    const moon = chart.planetary_positions.find(p => p.celestial_body === 'Moon');
    const ascendant = chart.planetary_positions.find(p => p.celestial_body === 'Ascendant');
    
    return {
      sun_sign: sun?.zodiac_sign || 'Unknown',
      moon_sign: moon?.zodiac_sign || 'Unknown',
      rising_sign: ascendant?.zodiac_sign || 'Unknown',
    };
  };

  const summary = getChartSummary();

  return (
    <div className="space-y-6">
      {/* Chart Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-900">Natal Chart</h2>
          <div className="text-sm text-gray-500">
            <div className="flex items-center space-x-4">
              <span className="flex items-center">
                <Calendar className="h-4 w-4 mr-1" />
                {new Date(chart.birth_data.birth_date + 'T12:00:00').toLocaleDateString()}
              </span>
              {chart.birth_data.birth_time && (
                <span className="flex items-center">
                  <Clock className="h-4 w-4 mr-1" />
                  {chart.birth_data.birth_time}
                </span>
              )}
              <span className="flex items-center">
                <MapPin className="h-4 w-4 mr-1" />
                {chart.birth_data.birth_location}
              </span>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg mb-6">
          {[
            { key: 'summary', label: 'Summary' },
            { key: 'planets', label: 'Planets' },
            { key: 'houses', label: 'Houses' },
            { key: 'aspects', label: 'Aspects' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as 'summary' | 'planets' | 'houses' | 'aspects')}
              className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                activeTab === tab.key
                  ? 'bg-white text-purple-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="space-y-6">
          {/* Summary Tab */}
          {activeTab === 'summary' && (
            <div className="space-y-4">
              <div className="grid md:grid-cols-3 gap-4">
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <Sun className="h-5 w-5 text-yellow-500" />
                    <span className="font-medium text-gray-900">Sun Sign</span>
                  </div>
                  <p className="text-lg font-semibold text-yellow-700">{summary.sun_sign}</p>
                  <p className="text-sm text-gray-600">Core identity & ego</p>
                </div>

                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <Moon className="h-5 w-5 text-blue-400" />
                    <span className="font-medium text-gray-900">Moon Sign</span>
                  </div>
                  <p className="text-lg font-semibold text-blue-700">{summary.moon_sign}</p>
                  <p className="text-sm text-gray-600">Emotions & instincts</p>
                </div>

                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <Zap className="h-5 w-5 text-green-500" />
                    <span className="font-medium text-gray-900">Rising Sign</span>
                  </div>
                  <p className="text-lg font-semibold text-green-700">{summary.rising_sign}</p>
                  <p className="text-sm text-gray-600">Outer personality</p>
                </div>
              </div>

              <div className="bg-purple-50 p-4 rounded-lg">
                <h3 className="font-medium text-purple-900 mb-2">Chart Information</h3>
                <div className="grid md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">House System:</span>
                    <span className="ml-2 font-medium">{chart.house_system}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Coordinates:</span>
                    <span className="ml-2 font-medium">
                      {chart.birth_data.latitude.toFixed(4)}°, {chart.birth_data.longitude.toFixed(4)}°
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Planets Tab */}
          {activeTab === 'planets' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Planetary Positions</h3>
                <button
                  onClick={() => toggleSection('planets')}
                  className="text-gray-500 hover:text-gray-700"
                >
                  {expandedSections.planets ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                </button>
              </div>

              {expandedSections.planets && (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-2 px-3 font-medium text-gray-900">Planet</th>
                        <th className="text-left py-2 px-3 font-medium text-gray-900">Sign</th>
                        <th className="text-left py-2 px-3 font-medium text-gray-900">Degree</th>
                        <th className="text-left py-2 px-3 font-medium text-gray-900">House</th>
                        <th className="text-left py-2 px-3 font-medium text-gray-900">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {chart.planetary_positions.map((planet, index) => (
                        <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-3 px-3">
                            <div className="flex items-center space-x-2">
                              {CELESTIAL_BODY_ICONS[planet.celestial_body]}
                              <span className="font-medium">{planet.celestial_body}</span>
                            </div>
                          </td>
                          <td className="py-3 px-3 font-medium text-purple-600">
                            {planet.zodiac_sign}
                          </td>
                          <td className="py-3 px-3 font-mono text-sm">
                            {formatDegree(planet.degree_in_sign)}
                          </td>
                          <td className="py-3 px-3">
                            House {planet.house_number}
                          </td>
                          <td className="py-3 px-3">
                            {planet.retrograde && (
                              <div className="flex items-center space-x-1 text-orange-600">
                                <RotateCcw className="h-3 w-3" />
                                <span className="text-xs">Retrograde</span>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Houses Tab */}
          {activeTab === 'houses' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">House Cusps</h3>
                <button
                  onClick={() => toggleSection('houses')}
                  className="text-gray-500 hover:text-gray-700"
                >
                  {expandedSections.houses ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                </button>
              </div>

              {expandedSections.houses && (
                <div className="grid md:grid-cols-2 gap-4">
                  {chart.house_cusps.map((house, index) => (
                    <div key={index} className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <Home className="h-4 w-4 text-indigo-500" />
                          <span className="font-medium text-gray-900">House {house.house_number}</span>
                        </div>
                        <span className="font-mono text-sm text-gray-600">
                          {formatDegree(house.degree_in_sign)}
                        </span>
                      </div>
                      <p className="text-purple-600 font-medium">{house.zodiac_sign}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Aspects Tab */}
          {activeTab === 'aspects' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Major Aspects</h3>
                <button
                  onClick={() => toggleSection('aspects')}
                  className="text-gray-500 hover:text-gray-700"
                >
                  {expandedSections.aspects ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                </button>
              </div>

              {expandedSections.aspects && (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-2 px-3 font-medium text-gray-900">Planet 1</th>
                        <th className="text-left py-2 px-3 font-medium text-gray-900">Aspect</th>
                        <th className="text-left py-2 px-3 font-medium text-gray-900">Planet 2</th>
                        <th className="text-left py-2 px-3 font-medium text-gray-900">Orb</th>
                        <th className="text-left py-2 px-3 font-medium text-gray-900">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {chart.aspects.map((aspect, index) => (
                        <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-3 px-3">
                            <div className="flex items-center space-x-2">
                              {CELESTIAL_BODY_ICONS[aspect.body1]}
                              <span className="font-medium">{aspect.body1}</span>
                            </div>
                          </td>
                          <td className="py-3 px-3">
                            <span className={`font-medium capitalize ${ASPECT_COLORS[aspect.aspect_type] || 'text-gray-600'}`}>
                              {aspect.aspect_type}
                            </span>
                          </td>
                          <td className="py-3 px-3">
                            <div className="flex items-center space-x-2">
                              {CELESTIAL_BODY_ICONS[aspect.body2]}
                              <span className="font-medium">{aspect.body2}</span>
                            </div>
                          </td>
                          <td className="py-3 px-3 font-mono text-sm">
                            {aspect.orb.toFixed(2)}°
                          </td>
                          <td className="py-3 px-3">
                            <span className={`text-xs px-2 py-1 rounded-full ${
                              aspect.applying 
                                ? 'bg-green-100 text-green-700' 
                                : 'bg-gray-100 text-gray-700'
                            }`}>
                              {aspect.applying ? 'Applying' : 'Separating'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
