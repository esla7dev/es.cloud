const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface SearchRequest {
  query: string;
  location?: string;
  placeId?: string;
  coordinates?: { lat: number; lng: number };
  radius?: number;
  type?: string;
}

interface GooglePlacesResponse {
  results: Array<{
    place_id: string;
    name: string;
    formatted_address: string;
    geometry: {
      location: {
        lat: number;
        lng: number;
      };
    };
    rating?: number;
    user_ratings_total?: number;
    types: string[];
    formatted_phone_number?: string;
    website?: string;
    opening_hours?: {
      weekday_text: string[];
    };
    price_level?: number;
  }>;
  status: string;
  next_page_token?: string;
}

interface PlaceDetailsResponse {
  result: {
    place_id: string;
    name: string;
    formatted_address: string;
    formatted_phone_number?: string;
    international_phone_number?: string;
    website?: string;
    url?: string;
    rating?: number;
    user_ratings_total?: number;
    price_level?: number;
    opening_hours?: {
      weekday_text: string[];
      open_now?: boolean;
    };
    business_status?: string;
    types: string[];
    geometry: {
      location: {
        lat: number;
        lng: number;
      };
    };
    reviews?: Array<{
      author_name: string;
      rating: number;
      text: string;
      time: number;
    }>;
  };
  status: string;
}

const getPriceLevel = (level?: number): string => {
  if (!level) return '';
  const levels = ['', 'رخيص', 'متوسط', 'مكلف', 'مكلف جداً'];
  return levels[level] || '';
};

const getBusinessCategory = (types: string[]): string => {
  const categoryMap: { [key: string]: string } = {
    'restaurant': 'مطعم',
    'food': 'طعام',
    'pharmacy': 'صيدلية',
    'hospital': 'مستشفى',
    'bank': 'بنك',
    'school': 'مدرسة',
    'shopping_mall': 'مركز تسوق',
    'gas_station': 'محطة وقود',
    'electronics_store': 'متجر إلكترونيات',
    'book_store': 'مكتبة',
    'clothing_store': 'متجر ملابس',
    'grocery_or_supermarket': 'بقالة',
    'store': 'متجر',
    'establishment': 'منشأة',
    'point_of_interest': 'نقطة اهتمام'
  };

  for (const type of types) {
    if (categoryMap[type]) {
      return categoryMap[type];
    }
  }
  
  return types[0] || 'عام';
};

const fetchPlaceDetails = async (placeId: string, apiKey: string): Promise<PlaceDetailsResponse['result'] | null> => {
  try {
    const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=place_id,name,formatted_address,formatted_phone_number,international_phone_number,website,url,rating,user_ratings_total,price_level,opening_hours,business_status,types,geometry,reviews&key=${apiKey}`;
    
    const response = await fetch(detailsUrl);
    const data: PlaceDetailsResponse = await response.json();
    
    if (data.status === 'OK') {
      return data.result;
    }
    
    console.warn(`Failed to fetch details for place ${placeId}: ${data.status}`);
    return null;
  } catch (error) {
    console.error(`Error fetching place details for ${placeId}:`, error);
    return null;
  }
};

const fetchPlacesPage = async (url: string): Promise<GooglePlacesResponse> => {
  const response = await fetch(url);
  const data: GooglePlacesResponse = await response.json();
  return data;
};

const sleep = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const apiKey = Deno.env.get('GOOGLE_MAPS_API_KEY');
    if (!apiKey) {
      throw new Error('Google Maps API key not configured');
    }

    const { query, location, placeId, coordinates, radius = 5000, type }: SearchRequest = await req.json();

    if (!query) {
      return new Response(
        JSON.stringify({ error: 'Query parameter is required' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    let searchQuery = query;
    let locationBias = '';
    
    if (coordinates) {
      locationBias = `&location=${coordinates.lat},${coordinates.lng}&radius=${radius}`;
      console.log('Using coordinates for location bias:', coordinates);
    } else if (placeId) {
      console.log('PlaceId available but no coordinates, using location string:', placeId);
      if (location) {
        searchQuery += ` in ${location}`;
      }
    } else if (location) {
      searchQuery += ` in ${location}`;
    }
    
    let baseUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(searchQuery)}${locationBias}&key=${apiKey}`;
    
    if (type && type !== 'all') {
      baseUrl += `&type=${type}`;
    }

    console.log('Starting paginated search with query:', searchQuery, 'and location bias:', locationBias);

    const allResults: any[] = [];
    let nextPageToken: string | undefined;
    let pageCount = 0;
    const maxPages = 5;

    console.log('Fetching page 1...');
    let data = await fetchPlacesPage(baseUrl);

    if (data.status !== 'OK') {
      console.error('Google Places API error:', data.status);
      throw new Error(`Google Places API error: ${data.status}`);
    }

    allResults.push(...data.results);
    nextPageToken = data.next_page_token;
    pageCount = 1;

    console.log(`Page 1: Found ${data.results.length} results`);

    while (nextPageToken && pageCount < maxPages) {
      console.log(`Waiting 2 seconds before fetching page ${pageCount + 1}...`);
      await sleep(2000);

      try {
        const nextPageUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?pagetoken=${nextPageToken}&key=${apiKey}`;
        console.log(`Fetching page ${pageCount + 1}...`);
        
        data = await fetchPlacesPage(nextPageUrl);

        if (data.status === 'OK') {
          allResults.push(...data.results);
          nextPageToken = data.next_page_token;
          pageCount++;
          console.log(`Page ${pageCount}: Found ${data.results.length} results`);
        } else {
          console.warn(`Page ${pageCount + 1} failed with status: ${data.status}`);
          break;
        }
      } catch (error) {
        console.error(`Error fetching page ${pageCount + 1}:`, error);
        break;
      }
    }

    console.log(`Total results collected: ${allResults.length} from ${pageCount} pages`);

    const uniqueResults = allResults.filter((result, index, self) => 
      index === self.findIndex(r => r.place_id === result.place_id)
    );

    console.log(`Unique results after deduplication: ${uniqueResults.length}`);

    const resultsToProcess = uniqueResults.slice(0, 100);
    console.log(`Processing detailed information for ${resultsToProcess.length} places...`);

    const detailedResults = await Promise.all(
      resultsToProcess.map(async (place, index) => {
        try {
          if (index > 0 && index % 10 === 0) {
            await sleep(1000);
          }

          const details = await fetchPlaceDetails(place.place_id, apiKey);
          
          const mergedData = {
            ...place,
            ...details
          };

          return {
            id: mergedData.place_id,
            name: mergedData.name,
            address: mergedData.formatted_address,
            phone: mergedData.formatted_phone_number || mergedData.international_phone_number || undefined,
            website: mergedData.website && mergedData.website.trim() !== '' ? mergedData.website : undefined,
            rating: mergedData.rating || 0,
            reviewCount: mergedData.user_ratings_total || 0,
            category: getBusinessCategory(mergedData.types),
            coordinates: {
              lat: mergedData.geometry.location.lat,
              lng: mergedData.geometry.location.lng
            },
            hours: mergedData.opening_hours?.weekday_text?.join('\n'),
            priceLevel: getPriceLevel(mergedData.price_level),
            businessStatus: mergedData.business_status,
            isOpen: mergedData.opening_hours?.open_now,
            googleUrl: mergedData.url,
            reviews: mergedData.reviews?.slice(0, 3)
          };
        } catch (error) {
          console.error(`Error processing place ${place.place_id}:`, error);
          return {
            id: place.place_id,
            name: place.name,
            address: place.formatted_address,
            phone: place.formatted_phone_number,
            website: place.website && place.website.trim() !== '' ? place.website : undefined,
            rating: place.rating || 0,
            reviewCount: place.user_ratings_total || 0,
            category: getBusinessCategory(place.types),
            coordinates: {
              lat: place.geometry.location.lat,
              lng: place.geometry.location.lng
            },
            hours: place.opening_hours?.weekday_text?.join('\n'),
            priceLevel: getPriceLevel(place.price_level),
            businessStatus: 'OPERATIONAL',
            isOpen: undefined,
            googleUrl: undefined,
            reviews: undefined
          };
        }
      })
    );

    const validResults = detailedResults.filter(result => result !== null);

    console.log(`Returning ${validResults.length} detailed results from ${pageCount} pages`);

    return new Response(
      JSON.stringify({ 
        results: validResults,
        totalResults: validResults.length,
        pagesProcessed: pageCount,
        hasMorePages: nextPageToken ? true : false
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Error in google-places-search function:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'حدث خطأ في البحث، يرجى المحاولة مرة أخرى',
        details: error.message 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});