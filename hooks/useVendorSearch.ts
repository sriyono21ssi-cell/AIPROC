
import React, { useState, useMemo, useCallback } from 'react';
import { searchVendors } from 'services/geminiService';
import type { SearchResult } from 'types';

const initialState = {
  query: '',
  category: '',
  location: '',
  useCurrentLocation: false,
  isLoading: false,
  searchResults: [] as SearchResult[],
  error: '',
  sortBy: 'relevance',
  minRating: 0,
};

export const useVendorSearch = () => {
  const [query, setQuery] = useState(initialState.query);
  const [category, setCategory] = useState(initialState.category);
  const [location, setLocation] = useState(initialState.location);
  const [useCurrentLocation, setUseCurrentLocation] = useState(initialState.useCurrentLocation);
  const [isLoading, setIsLoading] = useState(initialState.isLoading);
  const [searchResults, setSearchResults] = useState<SearchResult[]>(initialState.searchResults);
  const [error, setError] = useState(initialState.error);
  
  const [sortBy, setSortBy] = useState(initialState.sortBy);
  const [minRating, setMinRating] = useState(initialState.minRating);

  const handleSearch = useCallback(async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!query) {
      setError('Nama barang/layanan harus diisi.');
      return;
    }
    setError('');
    setIsLoading(true);
    setSearchResults([]);
    setSortBy('relevance');
    setMinRating(0);

    let userCoords: GeolocationCoordinates | undefined = undefined;
    if (useCurrentLocation) {
        try {
            const position = await new Promise<GeolocationPosition>((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 10000 });
            });
            userCoords = position.coords;
        } catch (geoError) {
            let errorMessage = "Gagal mendapatkan lokasi saat ini. Silakan masukkan lokasi secara manual.";
            if (geoError instanceof GeolocationPositionError) {
                // Changed to console.warn as this is a user-cancellable action, not a critical app error.
                console.warn(`Geolocation error: ${geoError.message} (code: ${geoError.code})`);
                switch (geoError.code) {
                    case geoError.PERMISSION_DENIED:
                        errorMessage = "Akses lokasi ditolak. Mohon izinkan akses lokasi di pengaturan browser Anda dan coba lagi, atau masukkan lokasi secara manual.";
                        setUseCurrentLocation(false); // Uncheck the box for better UX
                        break;
                    case geoError.POSITION_UNAVAILABLE:
                        errorMessage = "Informasi lokasi tidak tersedia. Pastikan GPS atau layanan lokasi Anda aktif.";
                        break;
                    case geoError.TIMEOUT:
                        errorMessage = "Waktu permintaan lokasi habis. Silakan coba lagi.";
                        break;
                }
            } else {
                 console.error("An unexpected error occurred while getting location:", geoError);
            }
            setError(errorMessage);
            setIsLoading(false);
            return;
        }
    }
    
    const locationText = useCurrentLocation ? '' : location;
    const finalCoords = useCurrentLocation ? userCoords : undefined;

    const results = await searchVendors(query, locationText, finalCoords);
    if (results.length === 0) {
        setError('Tidak ada vendor yang ditemukan. Coba kata kunci atau lokasi yang berbeda.');
    }
    setSearchResults(results);
    setIsLoading(false);
  }, [query, location, useCurrentLocation, setUseCurrentLocation, setError, setIsLoading, setSearchResults, setSortBy, setMinRating]);

  const resetSearch = useCallback(() => {
    setQuery(initialState.query);
    setCategory(initialState.category);
    setLocation(initialState.location);
    setUseCurrentLocation(initialState.useCurrentLocation);
    setIsLoading(initialState.isLoading);
    setSearchResults(initialState.searchResults);
    setError(initialState.error);
    setSortBy(initialState.sortBy);
    setMinRating(initialState.minRating);
  }, []);

  const displayedResults = useMemo(() => {
    let results = [...searchResults];
    if (minRating > 0) {
        results = results.filter(r => r.rating >= minRating);
    }
    if (sortBy === 'rating_desc') {
        results.sort((a, b) => b.rating - a.rating);
    } else if (sortBy === 'rating_asc') {
        results.sort((a, b) => a.rating - b.rating);
    }
    return results;
  }, [searchResults, sortBy, minRating]);

  return {
    query, setQuery,
    category, setCategory,
    location, setLocation,
    useCurrentLocation, setUseCurrentLocation,
    isLoading,
    searchResults,
    error,
    sortBy, setSortBy,
    minRating, setMinRating,
    handleSearch,
    resetSearch,
    displayedResults
  };
};