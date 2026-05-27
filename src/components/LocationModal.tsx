import React, { useState, useEffect, useRef } from 'react';
import { X, MapPin, Navigation } from 'lucide-react';
import { useLocationContext } from '../context/LocationContext';
import { setOptions, importLibrary } from '@googlemaps/js-api-loader';

export default function LocationModal({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const [addressInput, setAddressInput] = useState('');
  const [loading, setLoading] = useState(false);
  const { setManualLocation, useDeviceLocation } = useLocationContext();
  
  const autocompleteContainerRef = useRef<HTMLDivElement>(null);
  const autocompleteInstanceRef = useRef<any>(null);
  const autocompleteTextRef = useRef('');
  
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  const handleManualSubmit = async (query: string) => {
    const trimmedQuery = query?.trim();
    if (!trimmedQuery) {
      alert("Please enter an address.");
      return;
    }

    if (trimmedQuery.length < 3) {
      alert("Please enter a longer address or location name.");
      return;
    }

    if (!/[a-zA-Z]/.test(trimmedQuery)) {
      alert("Please enter a valid address containing letters.");
      return;
    }
    
    setLoading(true);
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(trimmedQuery)}`);
      const data = await res.json();
      
      if (data && data.length > 0) {
        setManualLocation(trimmedQuery, parseFloat(data[0].lat), parseFloat(data[0].lon));
        onClose();
      } else {
        alert("Address not found. Please try a different search term.");
      }
    } catch (err) {
      console.error("Geocoding error:", err);
      alert("Error finding address. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isOpen || !apiKey || !autocompleteContainerRef.current) return;

    let isMounted = true;

    const initAutocomplete = async () => {
      setOptions({
        key: apiKey,
        v: 'weekly',
      });

      try {
        const { PlaceAutocompleteElement } = await importLibrary('places') as any;
        
        if (!isMounted || !autocompleteContainerRef.current) return;
        
        autocompleteContainerRef.current.innerHTML = '';
        
        const autocompleteEl = new PlaceAutocompleteElement();
        autocompleteInstanceRef.current = autocompleteEl;
        
        // Track input value since Web Component doesn't expose it directly
        autocompleteEl.addEventListener('input', (e: Event) => {
          const target = e.composedPath()[0] as HTMLInputElement;
          if (target && typeof target.value === 'string') {
            autocompleteTextRef.current = target.value;
          }
        });
        
        // Basic styling to make it fit the container and force light mode
        autocompleteEl.style.width = '100%';
        autocompleteEl.style.display = 'block';
        
        // Force light mode colors using CSS variables
        autocompleteEl.style.setProperty('--gmp-color-surface', '#f9fafb');
        autocompleteEl.style.setProperty('--gmp-color-on-surface', '#111827');
        autocompleteEl.style.setProperty('--gmp-color-on-surface-variant', '#6b7280');
        autocompleteEl.style.setProperty('--gmp-radius', '0.75rem');
        autocompleteEl.style.setProperty('color-scheme', 'light');
        
        autocompleteEl.addEventListener('gmp-placeselect', async (e: any) => {
          const place = e.place;
          if (!place) return;
          
          setLoading(true);
          try {
            await place.fetchFields({ fields: ['displayName', 'location'] });
            if (place.location) {
              setManualLocation(
                place.displayName || autocompleteTextRef.current || 'Selected Location',
                place.location.lat(),
                place.location.lng()
              );
              onClose();
            }
          } catch (err) {
            console.error("Error fetching place details:", err);
            // Fallback if the user hit enter on an unselected text query
            handleManualSubmit(autocompleteTextRef.current);
          } finally {
            setLoading(false);
          }
        });
        
        // Listen for Enter key directly on the element to catch manual submissions
        autocompleteEl.addEventListener('keydown', (e: KeyboardEvent) => {
          if (e.key === 'Enter') {
            e.preventDefault(); // Prevent default form submission
            const target = e.composedPath()[0] as HTMLInputElement;
            const query = target?.value || autocompleteTextRef.current;
            
            // Give the component a tiny delay to process its own selection first
            setTimeout(() => {
              // If loading is true, it means gmp-placeselect fired and is handling it
              setLoading((currentLoading) => {
                if (!currentLoading) {
                  handleManualSubmit(query);
                }
                return currentLoading;
              });
            }, 50);
          }
        });
        
        autocompleteContainerRef.current.appendChild(autocompleteEl);
      } catch (err) {
        console.error("Failed to load places library", err);
      }
    };

    initAutocomplete();

    return () => {
      isMounted = false;
      if (autocompleteContainerRef.current) {
        autocompleteContainerRef.current.innerHTML = '';
      }
    };
  }, [isOpen, apiKey, setManualLocation, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl">
        <div className="p-4 border-b border-gray-100 flex justify-between items-center">
          <h2 className="text-lg font-bold text-gray-900">Set Location</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 text-gray-500 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>
        <div className="p-6">
          <button
            onClick={() => { useDeviceLocation(); onClose(); }}
            className="w-full flex items-center justify-center gap-3 p-3 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-xl font-medium mb-6 transition-colors"
          >
            <Navigation size={20} /> Use Current Location
          </button>
          
          <div className="relative flex items-center py-2 mb-6">
            <div className="flex-grow border-t border-gray-200"></div>
            <span className="flex-shrink-0 mx-4 text-gray-400 text-sm font-medium uppercase tracking-wider">or enter address</span>
            <div className="flex-grow border-t border-gray-200"></div>
          </div>
          
          {apiKey ? (
            <form onSubmit={(e) => {
              e.preventDefault();
              let query = autocompleteTextRef.current;
              if (!query && autocompleteInstanceRef.current?.shadowRoot) {
                const input = autocompleteInstanceRef.current.shadowRoot.querySelector('input');
                if (input) query = input.value;
              }
              handleManualSubmit(query);
            }}>
              <div className="relative mb-4">
                <div 
                  ref={autocompleteContainerRef} 
                  className="w-full min-h-[56px] bg-gray-50 border border-gray-200 rounded-xl"
                >
                  {/* Google Maps PlaceAutocompleteElement will be injected here */}
                </div>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gray-900 text-white py-4 rounded-xl font-medium hover:bg-gray-800 disabled:opacity-50 transition-colors"
              >
                {loading ? 'Searching...' : 'Set Location'}
              </button>
            </form>
          ) : (
            <form onSubmit={(e) => {
              e.preventDefault();
              handleManualSubmit(addressInput);
            }}>
              <div className="relative mb-4">
                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="City, neighborhood, or zip code..."
                  className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  value={addressInput}
                  onChange={(e) => setAddressInput(e.target.value)}
                  autoFocus
                />
              </div>
              <button
                type="submit"
                disabled={loading || !addressInput.trim()}
                className="w-full bg-gray-900 text-white py-4 rounded-xl font-medium hover:bg-gray-800 disabled:opacity-50 transition-colors"
              >
                {loading ? 'Searching...' : 'Set Location'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
