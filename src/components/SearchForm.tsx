import React, { useState, useCallback } from 'react';
import { Search, Filter, Loader2 } from 'lucide-react';
import { SearchParams } from '../types/business';
import { businessCategories } from '../services/mockData';
import { validateArabicKeywords } from '../utils/arabicHelpers';
import LocationAutocomplete from './LocationAutocomplete';

interface SearchFormProps {
  onSearch: (params: SearchParams) => void;
  loading: boolean;
}

export default function SearchForm({ 
  onSearch,
  loading 
}: SearchFormProps) {
  const [keywords, setKeywords] = useState('');
  const [location, setLocation] = useState('');
  const [category, setCategory] = useState('all');
  const [radius, setRadius] = useState(5000);
  const [placeId, setPlaceId] = useState<string | undefined>();
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | undefined>();
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (!keywords.trim()) {
      newErrors.keywords = 'الكلمات المفتاحية مطلوبة';
    } else if (!validateArabicKeywords(keywords)) {
      newErrors.keywords = 'يرجى إدخال كلمات مفتاحية صحيحة';
    }

    if (!location.trim()) {
      newErrors.location = 'الموقع مطلوب';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    const searchParams: SearchParams = {
      keywords: keywords.trim(),
      location: location.trim(),
      coordinates: coordinates || null,
      placeId: placeId,
      category,
      radius
    };

    onSearch(searchParams);
  };

  const handleLocationChange = (newLocation: string, newPlaceId?: string, newCoordinates?: { lat: number; lng: number }) => {
    setLocation(newLocation);
    setPlaceId(newPlaceId);
    setCoordinates(newCoordinates);
  };

  const radiusOptions = [
    { value: 5000, label: '5 كم' },
    { value: 10000, label: '10 كم' },
    { value: 15000, label: '15 كم' },
    { value: 20000, label: '20 كم' },
    { value: 25000, label: '25 كم' },
    { value: 30000, label: '30 كم' },
    { value: 40000, label: '40 كم' },
    { value: 50000, label: '50 كم' }
  ];

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex items-center gap-3 mb-6">
        <Search className="w-6 h-6 text-blue-600" />
        <h2 className="text-xl font-bold text-gray-900">حملة تسويقية جديدة</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Keywords Input */}
        <div>
          <label htmlFor="keywords" className="block text-sm font-medium text-gray-700 mb-2 text-right">
            الكلمات المفتاحية للبحث *
          </label>
          <input
            id="keywords"
            type="text"
            value={keywords}
            onChange={(e) => setKeywords(e.target.value)}
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-right ${
              errors.keywords ? 'border-red-300 bg-red-50' : 'border-gray-300'
            }`}
            placeholder="مثال: مطاعم، فنادق، صيدليات"
            dir="rtl"
          />
          {errors.keywords && (
            <p className="mt-1 text-sm text-red-600 text-right">{errors.keywords}</p>
          )}
        </div>

        {/* Location Picker */}
        <div>
          <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2 text-right">
            الموقع * (ابدأ بالكتابة لرؤية الاقتراحات)
          </label>
          <LocationAutocomplete
            value={location}
            onChange={handleLocationChange}
            error={errors.location}
          />
        </div>

        {/* Category Dropdown */}
        <div>
          <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2 text-right">
            الفئة
          </label>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <select
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-right appearance-none"
            >
              {businessCategories.map(cat => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Radius Selector */}
        <div>
          <label htmlFor="radius" className="block text-sm font-medium text-gray-700 mb-2 text-right">
            نطاق البحث
          </label>
          <select
            id="radius"
            value={radius}
            onChange={(e) => setRadius(Number(e.target.value))}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-right appearance-none"
          >
            {radiusOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              جاري البحث...
            </>
          ) : (
            <>
              <Search className="w-5 h-5" />
              البحث عن الأعمال (رصيد: 1)
            </>
          )}
        </button>
      </form>
    </div>
  );
}