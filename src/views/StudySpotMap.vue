<template>
  <div class="study-spot-map-container">
    <div class="search-controls p-4 ps-0 bg-white border-b">
      <!-- Search Input and Button -->
      <div class="d-flex justify-content-start align-items-center w-100">
        <input type="text"
          v-model="locationQuery"
          @keyup.enter="searchLocation"
          placeholder="Enter an address or landmark..."
          class="p-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow"
          style="width:70%;"
        />
        <Button
          outlined
          size="medium"
          @click="searchLocation"
          :disabled="isLoading || !isApiLoaded"
          :icon="isLoading ? 'pi pi-spin pi-spinner' : 'pi pi-search'"
          :label="isLoading ? 'Searching...' : 'Search'"
          style="width:20%; margin-left: 10px;"
        >
        </Button>
      </div>

      <!-- Debug Info Display -->
      <!-- <div v-if="debugInfo" class="bg-blue-50 border border-blue-200 text-blue-700 px-3 py-2 rounded text-xs">
        <strong>Debug:</strong> {{ debugInfo }}
      </div> -->

      <!-- Error Message Display -->
      <div v-if="errorMessage" class="bg-red-100 border border-red-400 text-red-700 px-3 py-2 rounded text-xs mt-2">
        <strong class="font-bold">Error:</strong>
        <span class="block sm:inline">{{ errorMessage }}</span>
      </div>
    </div>

    <!-- Google Map Container -->
    <div ref="mapDiv" class="w-full map-container bg-gray-200">
      <div v-if="!isApiLoaded && !errorMessage" class="flex items-center justify-center h-full text-gray-500">
        Loading Google Maps...
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, defineProps } from 'vue';
import Button from 'primevue/button';

const emit = defineEmits(['placesUpdated']);

// Props for customization
const props = defineProps({
  height: {
    type: String,
    default: '400px'
  },
  apiKey: {
    type: String,
    required: true
  }
});

// --- Reactive State ---
const locationQuery = ref('Singapore Management University');
const mapDiv = ref(null);
const isLoading = ref(false);
const errorMessage = ref('');
const isApiLoaded = ref(false);
const debugInfo = ref('');

let map = null;
let placesService = null;
let infoWindow = null;
let geocoder = null;
let markers = []; // Array to hold map markers
let allPlaces = []; // Store all places for filtering

// SMU coordinates
const SMU_LOCATION = { lat: 1.2963, lng: 103.8502 };

// --- Google Maps API Logic ---

/**
 * Dynamically loads the Google Maps JavaScript API script.
 */
const loadGoogleMapsAPI = () => {
  if (!props.apiKey || props.apiKey === 'YOUR_API_KEY') {
    errorMessage.value = "⚠️ Configuration needed: Please provide a valid Google Maps API key.";
    isApiLoaded.value = false;
    return;
  }

  if (window.google && window.google.maps) {
    debugInfo.value = 'Google Maps already loaded';
    isApiLoaded.value = true;
    initializeMapServices();
    return;
  }

  const script = document.createElement('script');
  script.src = `https://maps.googleapis.com/maps/api/js?key=${props.apiKey}&libraries=places`;
  script.async = true;
  script.defer = true;
  
  script.onload = () => {
    debugInfo.value = 'Google Maps API loaded successfully';
    isApiLoaded.value = true;
    initializeMapServices();
  };

  script.onerror = () => {
    errorMessage.value = 'Failed to load Google Maps API. Check your API key, billing status, and internet connection.';
    isApiLoaded.value = false;
  };

  document.head.appendChild(script);
};

/**
 * Initializes map-related services after the API is loaded.
 */
const initializeMapServices = () => {
  if (!isApiLoaded.value || !window.google) {
    debugInfo.value = 'Waiting for Google Maps to load...';
    return;
  }
  
  geocoder = new window.google.maps.Geocoder();
  infoWindow = new window.google.maps.InfoWindow();
  debugInfo.value = 'Services initialized';
  initMap(SMU_LOCATION); // Default to SMU
};

/**
 * Creates and initializes the main map object.
 */
const initMap = (center) => {
  if (!mapDiv.value) {
    debugInfo.value = 'Map container not ready';
    return;
  }
  
  map = new window.google.maps.Map(mapDiv.value, {
    center: center,
    zoom: 15,
    disableDefaultUI: false,
    zoomControl: true,
    mapTypeControl: true,
  });
  
  placesService = new window.google.maps.places.PlacesService(map);
  debugInfo.value = `Map initialized at ${center.lat}, ${center.lng}`;
};

/**
 * Geocodes the user's input location and initiates the search.
 */
const searchLocation = async () => {
  if (!locationQuery.value || isLoading.value || !isApiLoaded.value) {
    return;
  }

  isLoading.value = true;
  errorMessage.value = '';
  debugInfo.value = `Geocoding: ${locationQuery.value}`;

  // Add "Singapore" to the query to bias results to Singapore
  const searchQuery = locationQuery.value.toLowerCase().includes('singapore') 
    ? locationQuery.value 
    : `${locationQuery.value}, Singapore`;

  geocoder.geocode({ 
    address: searchQuery,
    componentRestrictions: {
      country: 'SG' // Restrict to Singapore only
    }
  }, (results, status) => {
    debugInfo.value = `Geocoding status: ${status}`;

    if (status === 'OK' && results[0]) {
      const location = results[0].geometry.location;
      debugInfo.value = `Found location: ${location.lat()}, ${location.lng()}`;
      
      if (!map) {
        initMap({ lat: location.lat(), lng: location.lng() });
      } else {
        map.panTo(location);
        map.setZoom(15);
      }
      
      findNearbyStudyLocations(location);

    } else {
      errorMessage.value = `Could not find "${locationQuery.value}" in Singapore. Status: ${status}`;
      if (status === 'OVER_QUERY_LIMIT') {
        errorMessage.value += ' - You may have exceeded your API quota.';
      } else if (status === 'REQUEST_DENIED') {
        errorMessage.value += ' - API request denied. Check your API key restrictions.';
      } else if (status === 'ZERO_RESULTS') {
        errorMessage.value = `Could not find "${locationQuery.value}" in Singapore. Please try a different location.`;
      }
      isLoading.value = false;
    }
  });
};

/**
 * Clears all markers from the map.
 */
const clearMarkers = () => {
  for (let i = 0; i < markers.length; i++) {
    markers[i].setMap(null);
  }
  markers = [];
  debugInfo.value = 'Markers cleared';
};

/**
 * Searches for nearby places matching study-related keywords.
 */
const findNearbyStudyLocations = (location) => {
  debugInfo.value = 'Searching for nearby places...';

  if (!placesService) {
    errorMessage.value = "Places service not initialized. Please refresh and try again.";
    isLoading.value = false;
    return;
  }
  
  const allResults = [];
  let completedSearches = 0;
  const totalSearches = 3;
  
  // Search 1: Libraries and university libraries
  const libraryRequest = {
    location: location,
    radius: 1000, // 1km radius
    keyword: 'library NTU NUS SMU university',
    type: 'library'
  };
  
  // Search 2: Cafes
  const cafeRequest = {
    location: location,
    radius: 1000, // 1km radius
    keyword: 'cafe coffee study',
    type: 'cafe'
  };
  
  // Search 3: General study spaces
  const studyRequest = {
    location: location,
    radius: 1000, // 1km radius
    keyword: 'study space coworking workspace reading room',
  };

  const processResults = () => {
    completedSearches++;
    
    if (completedSearches === totalSearches) {
      clearMarkers();
      
      // Remove duplicates based on place_id while preserving full place object
      const seenIds = new Set();
      const uniquePlaces = allResults.filter(place => {
        if (seenIds.has(place.place_id)) {
          return false;
        }
        seenIds.add(place.place_id);
        return true;
      });
      
      // Prioritize libraries - sort so libraries appear first
      const sortedPlaces = uniquePlaces.sort((a, b) => {
        const aIsLibrary = a.types && (a.types.includes('library') || 
                          a.name.toLowerCase().includes('library') ||
                          a.name.toLowerCase().includes('ntu') ||
                          a.name.toLowerCase().includes('nus') ||
                          a.name.toLowerCase().includes('smu'));
        const bIsLibrary = b.types && (b.types.includes('library') || 
                          b.name.toLowerCase().includes('library') ||
                          b.name.toLowerCase().includes('ntu') ||
                          b.name.toLowerCase().includes('nus') ||
                          b.name.toLowerCase().includes('smu'));
        
        if (aIsLibrary && !bIsLibrary) return -1;
        if (!aIsLibrary && bIsLibrary) return 1;
        return 0;
      });
      
      // Store all places
      allPlaces = sortedPlaces;
      
      const libraryCount = sortedPlaces.filter(p => 
        p.types && (p.types.includes('library') || 
        p.name.toLowerCase().includes('library'))
      ).length;
      
      debugInfo.value = `Found ${sortedPlaces.length} places (${libraryCount} libraries, prioritized first)`;
      
      if (sortedPlaces.length === 0) {
        errorMessage.value = "No study spots found nearby. Try a different location.";
        isLoading.value = false;
      } else {
        // Display all markers
        displayMarkers();
      }
    }
  };

  // Execute library search
  placesService.nearbySearch(libraryRequest, (results, status) => {
    debugInfo.value = `Library search: ${status}`;
    if (status === window.google.maps.places.PlacesServiceStatus.OK && results) {
      allResults.push(...results);
    }
    processResults();
  });

  // Execute cafe search
  placesService.nearbySearch(cafeRequest, (results, status) => {
    debugInfo.value = `Cafe search: ${status}`;
    if (status === window.google.maps.places.PlacesServiceStatus.OK && results) {
      allResults.push(...results);
    }
    processResults();
  });

  // Execute study space search
  placesService.nearbySearch(studyRequest, (results, status) => {
    debugInfo.value = `Study space search: ${status}`;
    if (status === window.google.maps.places.PlacesServiceStatus.OK && results) {
      allResults.push(...results);
    }
    processResults();
  });
};

/**
 * Display all markers
 */
const displayMarkers = () => {
  clearMarkers();
  
  if (!allPlaces || allPlaces.length === 0) {
    isLoading.value = false;
    console.log('⚠️ Emitting 0 places');
    emit('placesUpdated', []);
    return;
  }

  console.log('✅ About to emit places:', allPlaces.length);
  console.log('✅ Places data:', allPlaces);
  
  debugInfo.value = `Displaying ${allPlaces.length} study spots`;

  // Emit the places data to parent component
  emit('placesUpdated', allPlaces);
  
  // Add markers with a slight delay for animation effect
  for (let i = 0; i < allPlaces.length; i++) {
    setTimeout(() => createMarker(allPlaces[i]), i * 50);
  }
  
  isLoading.value = false;
};

/**
 * Creates a map marker for a given place and adds it to the markers array.
 */
const createMarker = (place) => {
  if (!place.geometry || !place.geometry.location) return;

  const marker = new window.google.maps.Marker({
    map: map,
    position: place.geometry.location,
    title: place.name,
    animation: window.google.maps.Animation.DROP,
  });

  markers.push(marker); // Add the new marker to our tracking array

  marker.addListener('click', () => {
    // Show loading state
    infoWindow.setContent('<div style="padding: 20px; text-align: center;">Loading details...</div>');
    infoWindow.open(map, marker);

    // Get detailed place information
    const request = {
      placeId: place.place_id,
      fields: ['name', 'formatted_address', 'rating', 'photos', 'user_ratings_total']
    };

    placesService.getDetails(request, (placeDetails, status) => {
      if (status === window.google.maps.places.PlacesServiceStatus.OK && placeDetails) {
        const rating = placeDetails.rating || 0;
        const stars = '★'.repeat(Math.round(rating)) + '☆'.repeat(5 - Math.round(rating));
        
        // Get photo URL if available
        let photoHtml = '';
        if (placeDetails.photos && placeDetails.photos.length > 0) {
          try {
            const photoUrl = placeDetails.photos[0].getUrl({ maxWidth: 300, maxHeight: 200 });
            photoHtml = `<img src="${photoUrl}" alt="${placeDetails.name}" style="width: 100%; height: 150px; object-fit: cover; border-radius: 8px; margin-bottom: 8px;">`;
            console.log('Photo loaded for:', placeDetails.name);
          } catch (error) {
            console.error('Error loading photo for', placeDetails.name, error);
          }
        } else {
          console.log('No photos available for:', placeDetails.name);
        }
        
        const content = `
          <div style="font-family: sans-serif; max-width: 300px;">
            <div style="padding: 8px;">
              <h3 style="font-weight: bold; font-size: 16px; color: #1f2937; margin: 0 0 8px 0;">${placeDetails.name}</h3>
              ${photoHtml}
              <p style="color: #6b7280; font-size: 14px; margin: 4px 0;">${placeDetails.formatted_address || place.vicinity || 'Address not available'}</p>
              <p style="color: #f59e0b; font-size: 14px; margin: 4px 0;">${stars} ${rating > 0 ? '(' + rating + ')' : '(No rating)'}</p>
            </div>
          </div>
        `;
        
        infoWindow.setContent(content);
      } else {
        // Fallback to basic info if getDetails fails
        const rating = place.rating || 0;
        const stars = '★'.repeat(Math.round(rating)) + '☆'.repeat(5 - Math.round(rating));
        
        const content = `
          <div style="font-family: sans-serif; max-width: 300px;">
            <div style="padding: 8px;">
              <h3 style="font-weight: bold; font-size: 16px; color: #1f2937; margin: 0 0 8px 0;">${place.name}</h3>
              <p style="color: #6b7280; font-size: 14px; margin: 4px 0;">${place.vicinity || 'Address not available'}</p>
              <p style="color: #f59e0b; font-size: 14px; margin: 4px 0;">${stars} ${rating > 0 ? '(' + rating + ')' : '(No rating)'}</p>
            </div>
          </div>
        `;
        
        infoWindow.setContent(content);
      }
    });
  });
};

/**
 * Focus the map on a specific location and show info window with full details
 * This method is exposed to parent components via defineExpose
 */
const focusOnLocation = (location, name, placeId) => {
  if (!map) {
    console.error('Map not initialized');
    return;
  }
  
  // Handle both direct lat/lng objects and Google Maps LatLng objects
  const lat = typeof location.lat === 'function' ? location.lat() : location.lat;
  const lng = typeof location.lng === 'function' ? location.lng() : location.lng;
  
  const position = { lat, lng };
  
  // Smoothly pan to the location
  map.panTo(position);
  
  // Zoom in closer for focused view (stays until user changes it)
  map.setZoom(17);
  
  // Show loading info window first
  if (infoWindow) {
    infoWindow.setContent('<div style="padding: 20px; text-align: center;">Loading details...</div>');
    infoWindow.setPosition(position);
    infoWindow.open(map);
  }
  
  // Fetch detailed place information if placeId is provided
  if (placeId && placesService && infoWindow) {
    const request = {
      placeId: placeId,
      fields: ['name', 'formatted_address', 'rating', 'photos', 'user_ratings_total']
    };

    placesService.getDetails(request, (placeDetails, status) => {
      if (status === window.google.maps.places.PlacesServiceStatus.OK && placeDetails) {
        const rating = placeDetails.rating || 0;
        const stars = '★'.repeat(Math.round(rating)) + '☆'.repeat(5 - Math.round(rating));
        
        // Get photo URL if available
        let photoHtml = '';
        if (placeDetails.photos && placeDetails.photos.length > 0) {
          try {
            const photoUrl = placeDetails.photos[0].getUrl({ maxWidth: 300, maxHeight: 200 });
            photoHtml = `<img src="${photoUrl}" alt="${placeDetails.name}" style="width: 100%; height: 150px; object-fit: cover; border-radius: 8px; margin-bottom: 8px;">`;
          } catch (error) {
            console.error('Error loading photo for', placeDetails.name, error);
          }
        }
        
        const content = `
          <div style="font-family: sans-serif; max-width: 300px;">
            <div style="padding: 8px;">
              <h3 style="font-weight: bold; font-size: 16px; color: #1f2937; margin: 0 0 8px 0;">${placeDetails.name}</h3>
              ${photoHtml}
              <p style="color: #6b7280; font-size: 14px; margin: 4px 0;">${placeDetails.formatted_address || 'Address not available'}</p>
              <p style="color: #f59e0b; font-size: 14px; margin: 4px 0;">${stars} ${rating > 0 ? '(' + rating + ')' : '(No rating)'}</p>
              ${placeDetails.user_ratings_total ? `<p style="color: #9ca3af; font-size: 12px; margin: 4px 0;">${placeDetails.user_ratings_total} reviews</p>` : ''}
            </div>
          </div>
        `;
        
        infoWindow.setContent(content);
      } else {
        // Fallback to basic info if getDetails fails
        const content = `
          <div style="font-family: sans-serif; max-width: 300px;">
            <div style="padding: 8px;">
              <h3 style="font-weight: bold; font-size: 16px; color: #1f2937; margin: 0;">${name}</h3>
              <p style="color: #6b7280; font-size: 14px; margin: 4px 0;">Details unavailable</p>
            </div>
          </div>
        `;
        infoWindow.setContent(content);
      }
    });
  } else if (name && infoWindow) {
    // If no placeId, just show the name
    infoWindow.setContent(`
      <div style="padding: 12px; font-family: sans-serif;">
        <h3 style="font-weight: bold; font-size: 16px; color: #1f2937; margin: 0;">${name}</h3>
      </div>
    `);
  }
};

// Expose the focusOnLocation method so parent components can call it
defineExpose({
  focusOnLocation
});

// --- Lifecycle Hooks ---
onMounted(() => {
  loadGoogleMapsAPI();
});

</script>

<style scoped>
.study-spot-map-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
}

.map-container {
  flex: 1;
  min-height: v-bind(height);
}

.search-controls {
  flex-shrink: 0;
}
</style>