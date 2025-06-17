'use client';

import React, { useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Calendar, Clock, MapPin, Settings, Loader2 } from 'lucide-react';
import { HouseSystem, CreateNatalChartRequest } from '@/types';
import { LoadingButton } from './LoadingSpinner';
import { GeocodingService } from '@/lib/geocoding';

const natalChartSchema = z.object({
  birth_date: z.string().min(1, 'Birth date is required'),
  birth_time: z.string().optional(),
  birth_location: z.string().min(1, 'Birth location is required').max(100, 'Location too long'),
  house_system: z.enum(['Placidus', 'Koch', 'Equal', 'Whole Sign', 'Campanus']),
});

type NatalChartFormData = z.infer<typeof natalChartSchema>;

interface NatalChartFormProps {
  onSubmit: (data: CreateNatalChartRequest) => Promise<void>;
  initialData?: Partial<{
    birth_date: string;
    birth_time?: string;
    birth_location: string;
    house_system: HouseSystem;
  }>;
  isLoading?: boolean;
  submitButtonText?: string;
}

const HOUSE_SYSTEMS: { value: HouseSystem; label: string; description: string }[] = [
  { value: 'Placidus', label: 'Placidus', description: 'Most popular system, unequal houses' },
  { value: 'Koch', label: 'Koch', description: 'Time-based system, similar to Placidus' },
  { value: 'Equal', label: 'Equal', description: 'All houses are exactly 30 degrees' },
  { value: 'Whole Sign', label: 'Whole Sign', description: 'Ancient system, one sign per house' },
  { value: 'Campanus', label: 'Campanus', description: 'Space-based system' },
];

export default function NatalChartForm({
  onSubmit,
  initialData,
  isLoading = false,
  submitButtonText = 'Generate Natal Chart'
}: NatalChartFormProps) {
  const [error, setError] = useState('');
  const [locationSuggestions, setLocationSuggestions] = useState<string[]>([]);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [geocodingError, setGeocodingError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<NatalChartFormData>({
    resolver: zodResolver(natalChartSchema),
    defaultValues: {
      birth_date: initialData?.birth_date || '',
      birth_time: initialData?.birth_time || '',
      birth_location: initialData?.birth_location || '',
      house_system: initialData?.house_system || 'Placidus',
    },
  });

  const watchedLocation = watch('birth_location');

  const handleFormSubmit = async (data: NatalChartFormData) => {
    setError('');
    setGeocodingError('');
    setIsGeocoding(true);

    try {
      // Geocode the location to get coordinates
      const geocodingResult = await GeocodingService.geocodeLocation(data.birth_location);
      
      // Create the request with geocoded coordinates
      const requestData: CreateNatalChartRequest = {
        birth_date: data.birth_date,
        birth_time: data.birth_time,
        birth_location: geocodingResult.display_name, // Use the formatted location name
        latitude: geocodingResult.latitude,
        longitude: geocodingResult.longitude,
        timezone: geocodingResult.timezone,
        house_system: data.house_system,
      };

      await onSubmit(requestData);
    } catch (err: unknown) {
      const error = err as { message?: string };
      if (error.message?.includes('not found') || error.message?.includes('geocod')) {
        setGeocodingError(error.message || 'Failed to find location. Please try a more specific location.');
      } else {
        setError(error.message || 'Failed to generate natal chart. Please try again.');
      }
    } finally {
      setIsGeocoding(false);
    }
  };

  const handleLocationChange = useCallback(async (location: string) => {
    setValue('birth_location', location);
    setGeocodingError('');
    
    if (location.length > 2) {
      try {
        const suggestions = await GeocodingService.getLocationSuggestions(location, 5);
        setLocationSuggestions(suggestions);
      } catch {
        // Fallback to static suggestions if geocoding fails
        const staticSuggestions = [
          'New York, NY, USA',
          'Los Angeles, CA, USA',
          'London, UK',
          'Paris, France',
          'Tokyo, Japan',
          'Sydney, Australia',
        ].filter(city => city.toLowerCase().includes(location.toLowerCase()));
        setLocationSuggestions(staticSuggestions.slice(0, 5));
      }
    } else {
      setLocationSuggestions([]);
    }
  }, [setValue]);

  const selectLocationSuggestion = (suggestion: string) => {
    setValue('birth_location', suggestion);
    setLocationSuggestions([]);
    setGeocodingError('');
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center space-x-3 mb-6">
        <Settings className="h-6 w-6 text-purple-600" />
        <h2 className="text-xl font-semibold text-gray-900">Birth Information</h2>
      </div>

      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
        {/* Birth Date and Time */}
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="birth_date" className="block text-sm font-medium text-gray-700 mb-2">
              <Calendar className="inline h-4 w-4 mr-1" />
              Birth Date *
            </label>
            <input
              {...register('birth_date')}
              type="date"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500"
            />
            {errors.birth_date && (
              <p className="mt-1 text-sm text-red-600">{errors.birth_date.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="birth_time" className="block text-sm font-medium text-gray-700 mb-2">
              <Clock className="inline h-4 w-4 mr-1" />
              Birth Time (optional)
            </label>
            <input
              {...register('birth_time')}
              type="time"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500"
            />
            <p className="mt-1 text-xs text-gray-500">
              More accurate time provides better house positions
            </p>
            {errors.birth_time && (
              <p className="mt-1 text-sm text-red-600">{errors.birth_time.message}</p>
            )}
          </div>
        </div>

        {/* Birth Location */}
        <div className="relative">
          <label htmlFor="birth_location" className="block text-sm font-medium text-gray-700 mb-2">
            <MapPin className="inline h-4 w-4 mr-1" />
            Birth Location *
          </label>
          <input
            {...register('birth_location')}
            type="text"
            placeholder="City, State/Province, Country (e.g., New York, NY, USA)"
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500"
            onChange={(e) => handleLocationChange(e.target.value)}
          />
          {locationSuggestions.length > 0 && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
              {locationSuggestions.map((suggestion, index) => (
                <button
                  key={index}
                  type="button"
                  className="w-full px-3 py-2 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none text-sm"
                  onClick={() => selectLocationSuggestion(suggestion)}
                >
                  {suggestion}
                </button>
              ))}
            </div>
          )}
          {errors.birth_location && (
            <p className="mt-1 text-sm text-red-600">{errors.birth_location.message}</p>
          )}
          {geocodingError && (
            <p className="mt-1 text-sm text-red-600">{geocodingError}</p>
          )}
          <p className="mt-1 text-xs text-gray-500">
            Coordinates will be automatically calculated from your location
          </p>
        </div>

        {/* House System */}
        <div>
          <label htmlFor="house_system" className="block text-sm font-medium text-gray-700 mb-2">
            House System
          </label>
          <select
            {...register('house_system')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500"
          >
            {HOUSE_SYSTEMS.map((system) => (
              <option key={system.value} value={system.value}>
                {system.label} - {system.description}
              </option>
            ))}
          </select>
          {errors.house_system && (
            <p className="mt-1 text-sm text-red-600">{errors.house_system.message}</p>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-3">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Submit Button */}
        <LoadingButton
          type="submit"
          loading={isLoading || isGeocoding}
          className="w-full bg-purple-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isGeocoding ? (
            <>
              <Loader2 className="inline h-4 w-4 mr-2 animate-spin" />
              Finding Location...
            </>
          ) : (
            submitButtonText
          )}
        </LoadingButton>
      </form>
    </div>
  );
}