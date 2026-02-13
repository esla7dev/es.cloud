import React, { useState, useEffect, useRef } from 'react';
import { Loader } from '@googlemaps/js-api-loader';
import { MapPin, Loader2 } from 'lucide-react';

interface LocationAutocompleteProps {
  value: string;
  onChange: (location: string, placeId?: string, coordinates?: { lat: number; lng: number }) => void;
  placeholder?: string;
  className?: string;
  error?: string;
}

export default function LocationAutocomplete({
  value,
  onChange,
  placeholder = "مثال: الرياض، جدة، الدمام",
  className = "",
  error
}: LocationAutocompleteProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<google.maps.places.AutocompletePrediction[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isGoogleLoaded, setIsGoogleLoaded] = useState(false);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteService = useRef<google.maps.places.AutocompleteService | null>(null);
  const placesService = useRef<google.maps.places.PlacesService | null>(null);
  const mapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const initializeGoogle = async () => {
      try {
        // Note: In a real implementation, you'd get this from environment variables
        // For now, we'll use a placeholder - you'll need to add your Google Maps API key
        const loader = new Loader({
          apiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || 'YOUR_GOOGLE_MAPS_API_KEY',
          version: 'weekly',
          libraries: ['places']
        });

        await loader.load();
        
        autocompleteService.current = new google.maps.places.AutocompleteService();
        
        // Create a hidden map for PlacesService
        if (mapRef.current) {
          const map = new google.maps.Map(mapRef.current, {
            center: { lat: 24.7136, lng: 46.6753 }, // Riyadh coordinates
            zoom: 10
          });
          placesService.current = new google.maps.places.PlacesService(map);
        }
        
        setIsGoogleLoaded(true);
      } catch (error) {
        console.error('Failed to load Google Maps API:', error);
        // Fallback to basic text input if Google Maps fails to load
        setIsGoogleLoaded(false);
      }
    };

    initializeGoogle();
  }, []);

  const fetchSuggestions = async (input: string) => {
    if (!autocompleteService.current || !input.trim() || input.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    setIsLoading(true);
    
    try {
      const request: google.maps.places.AutocompletionRequest = {
        input: input.trim(),
        types: ['(cities)'], // Focus on cities and regions
        componentRestrictions: { 
          country: ['sa', 'ae', 'qa', 'om', 'eg'] // Middle East countries
        }
      };

      autocompleteService.current.getPlacePredictions(request, (predictions, status) => {
        setIsLoading(false);
        
        if (status === google.maps.places.PlacesServiceStatus.OK && predictions) {
          setSuggestions(predictions);
          setShowSuggestions(true);
        } else {
          setSuggestions([]);
          setShowSuggestions(false);
        }
      });
    } catch (error) {
      console.error('Error fetching suggestions:', error);
      setIsLoading(false);
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue); // Update parent with text value
    
    // Debounce the API calls
    const timeoutId = setTimeout(() => {
      fetchSuggestions(newValue);
    }, 300);

    return () => clearTimeout(timeoutId);
  };

  const handleSuggestionClick = async (prediction: google.maps.places.AutocompletePrediction) => {
    if (!placesService.current) {
      // Fallback to just using the description
      onChange(prediction.description, prediction.place_id);
      setShowSuggestions(false);
      return;
    }

    setIsLoading(true);
    
    try {
      const request: google.maps.places.PlaceDetailsRequest = {
        placeId: prediction.place_id,
        fields: ['geometry', 'formatted_address', 'name']
      };

      placesService.current.getDetails(request, (place, status) => {
        setIsLoading(false);
        
        if (status === google.maps.places.PlacesServiceStatus.OK && place) {
          const coordinates = place.geometry?.location ? {
            lat: place.geometry.location.lat(),
            lng: place.geometry.location.lng()
          } : undefined;
          
          onChange(
            place.formatted_address || prediction.description,
            prediction.place_id,
            coordinates
          );
        } else {
          // Fallback to prediction description
          onChange(prediction.description, prediction.place_id);
        }
        
        setShowSuggestions(false);
      });
    } catch (error) {
      console.error('Error getting place details:', error);
      setIsLoading(false);
      onChange(prediction.description, prediction.place_id);
      setShowSuggestions(false);
    }
  };

  const handleInputBlur = () => {
    // Delay hiding suggestions to allow for clicks
    setTimeout(() => {
      setShowSuggestions(false);
    }, 200);
  };

  const handleInputFocus = () => {
    if (suggestions.length > 0) {
      setShowSuggestions(true);
    }
  };

  // If Google Maps API is not available, fall back to regular input
  if (!isGoogleLoaded) {
    return (
      <div className="relative">
        <div className="relative">
          <MapPin className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            ref={inputRef}
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className={`w-full pr-10 pl-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-right ${
              error ? 'border-red-300 bg-red-50' : 'border-gray-300'
            } ${className}`}
            placeholder={placeholder}
            dir="rtl"
          />
        </div>
        {error && (
          <p className="mt-1 text-sm text-red-600 text-right">{error}</p>
        )}
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Hidden map div for PlacesService */}
      <div ref={mapRef} style={{ display: 'none' }} />
      
      <div className="relative">
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center">
          {isLoading ? (
            <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
          ) : (
            <MapPin className="w-5 h-5 text-gray-400" />
          )}
        </div>
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
          className={`w-full pr-10 pl-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-right ${
            error ? 'border-red-300 bg-red-50' : 'border-gray-300'
          } ${className}`}
          placeholder={placeholder}
          dir="rtl"
          autoComplete="off"
        />
      </div>

      {/* Suggestions Dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {suggestions.map((prediction) => (
            <button
              key={prediction.place_id}
              type="button"
              onClick={() => handleSuggestionClick(prediction)}
              className="w-full px-4 py-3 text-right hover:bg-gray-50 focus:bg-gray-50 focus:outline-none border-b border-gray-100 last:border-b-0 transition-colors"
              dir="rtl"
            >
              <div className="flex items-center gap-3 justify-end">
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">
                    {prediction.structured_formatting.main_text}
                  </p>
                  {prediction.structured_formatting.secondary_text && (
                    <p className="text-xs text-gray-600">
                      {prediction.structured_formatting.secondary_text}
                    </p>
                  )}
                </div>
                <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0" />
              </div>
            </button>
          ))}
        </div>
      )}

      {error && (
        <p className="mt-1 text-sm text-red-600 text-right">{error}</p>
      )}
    </div>
  );
}