import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Search, Map as MapIcon, List, Navigation, Phone, Bookmark, Star, Clock, AlertTriangle, CheckCircle2, Mic } from 'lucide-react';
import { searchPlaces, searchEvents } from '../services/geminiService';
import { PlaceResult } from '../types';
import { useLocationContext } from '../context/LocationContext';
import VoiceSearchOverlay from '../components/VoiceSearchOverlay';
import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline } from 'react-leaflet';
import L from 'leaflet';

// Fix for default marker icon in react-leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

function MapUpdater({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, map.getZoom());
  }, [center, map]);
  return null;
}

export default function SearchResults() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const navigate = useNavigate();
  const { lat, lng, address } = useLocationContext();
  
  const [results, setResults] = useState<PlaceResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [isVoiceOpen, setIsVoiceOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState('Open now');
  const [searchType, setSearchType] = useState<'places' | 'events'>('places');
  const [timeframe, setTimeframe] = useState<'today' | 'tomorrow' | 'this weekend'>('today');

  useEffect(() => {
    if (query.toLowerCase().includes('event')) {
      setSearchType('events');
    }
  }, [query]);

  useEffect(() => {
    if (lat !== null && lng !== null) {
      setLoading(true);
      if (searchType === 'events') {
        searchEvents(query || 'events', lat, lng, timeframe, address).then((data) => {
          setResults(data);
          setLoading(false);
        });
      } else if (query) {
        searchPlaces(query, lat, lng).then((data) => {
          setResults(data);
          setLoading(false);
        });
      } else {
        setResults([]);
        setLoading(false);
      }
    }
  }, [query, lat, lng, address, searchType, timeframe]);

  const filteredAndSortedResults = React.useMemo(() => {
    let filtered = [...results];
    
    if (searchType === 'places') {
      if (activeFilter === 'Open now') {
        const openOnly = filtered.filter(p => p.isOpen);
        // If no results are open now, don't filter them out, just show all but maybe sort differently
        if (openOnly.length > 0) {
          filtered = openOnly;
        }
      } else if (activeFilter === '24/7') {
        filtered = filtered.filter(p => 
          p.is247 || 
          p.openStatusText?.toLowerCase().includes('24 hours') || 
          p.openStatusText?.toLowerCase().includes('24/7') ||
          p.weeklyHours?.some(h => h.toLowerCase().includes('24 hours') || h.toLowerCase().includes('24/7'))
        );
      }
    }
    
    if (activeFilter === 'Closest') {
      filtered.sort((a, b) => a.distanceMiles - b.distanceMiles);
    } else if (activeFilter === 'Best rated' && searchType === 'places') {
      filtered.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    } else {
      // Default sort
      filtered.sort((a, b) => {
        if (searchType === 'places') {
          if (a.isOpen && !b.isOpen) return -1;
          if (!a.isOpen && b.isOpen) return 1;
        }
        return a.distanceMiles - b.distanceMiles;
      });
    }
    
    return filtered;
  }, [results, activeFilter, searchType]);

  const mapCenter: [number, number] = filteredAndSortedResults.length > 0 ? [filteredAndSortedResults[0].lat, filteredAndSortedResults[0].lng] : (lat && lng ? [lat, lng] : [0, 0]);

  return (
    <div className="md:ml-64 h-screen flex flex-col bg-gray-50">
      <header className="sticky top-0 bg-white z-10 px-4 pt-4 md:px-8 md:pt-8 border-b border-gray-100 flex-shrink-0">
        <div className="max-w-3xl mx-auto w-full">
          <div className="flex items-center gap-4 mb-4">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="text"
                className="block w-full pl-10 pr-12 py-2 bg-gray-50 border border-gray-200 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                defaultValue={query}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    navigate(`/search?q=${encodeURIComponent(e.currentTarget.value)}`);
                  }
                }}
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                onClick={() => setIsVoiceOpen(true)}
              >
                <Mic className="h-4 w-4 text-blue-600 hover:text-blue-700" />
              </button>
            </div>
            <div className="flex bg-gray-50 rounded-xl border border-gray-200 p-1 shadow-sm">
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg ${viewMode === 'list' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              >
                <List size={18} />
              </button>
              <button
                onClick={() => setViewMode('map')}
                className={`p-2 rounded-lg ${viewMode === 'map' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              >
                <MapIcon size={18} />
              </button>
            </div>
          </div>
          
          <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0">
            <div className="flex bg-gray-100 rounded-lg p-1 mr-2 shrink-0">
              <button
                onClick={() => setSearchType('places')}
                className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${searchType === 'places' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              >
                Places
              </button>
              <button
                onClick={() => setSearchType('events')}
                className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${searchType === 'events' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              >
                Events
              </button>
            </div>

            {searchType === 'events' ? (
              <>
                <select 
                  value={timeframe} 
                  onChange={(e) => setTimeframe(e.target.value as any)}
                  className="bg-white border border-gray-200 text-gray-700 text-sm rounded-full px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 shrink-0"
                >
                  <option value="today">Today</option>
                  <option value="tomorrow">Tomorrow</option>
                  <option value="this weekend">This Weekend</option>
                </select>
                <FilterChip label="Closest" active={activeFilter === 'Closest'} onClick={() => setActiveFilter('Closest')} />
              </>
            ) : (
              <>
                <FilterChip label="Open now" active={activeFilter === 'Open now'} onClick={() => setActiveFilter('Open now')} />
                <FilterChip label="Closest" active={activeFilter === 'Closest'} onClick={() => setActiveFilter('Closest')} />
                <FilterChip label="Best rated" active={activeFilter === 'Best rated'} onClick={() => setActiveFilter('Best rated')} />
                <FilterChip label="24/7" active={activeFilter === '24/7'} onClick={() => setActiveFilter('24/7')} />
              </>
            )}
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-4 md:p-8">
        <div className="max-w-3xl mx-auto w-full pb-20">
          {address === 'Locating...' && (
            <div className="bg-blue-50 text-blue-700 px-4 py-2 rounded-xl mb-6 flex items-center text-sm animate-pulse">
              <Navigation size={14} className="mr-2" />
              Getting your precise location...
            </div>
          )}

          {address === 'Philadelphia, PA' && (
            <div className="bg-amber-50 text-amber-700 px-4 py-2 rounded-xl mb-6 flex items-center text-sm">
              <AlertTriangle size={14} className="mr-2" />
              Location access denied. Showing results for Philadelphia.
            </div>
          )}
          
          {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mb-4"></div>
            <p className="text-gray-500">Finding the best options near you...</p>
          </div>
        ) : filteredAndSortedResults.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-500 text-lg">No exact match nearby.</p>
            <p className="text-gray-400 mt-2">Try adjusting your search or expanding the area.</p>
          </div>
        ) : viewMode === 'list' ? (
          <div className="space-y-6 pt-4">
            {/* Best Overall Hero Card */}
            {filteredAndSortedResults[0] && (
              <div className="relative">
                <div className="absolute -top-3 left-4 bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-sm z-10">
                  Best Overall
                </div>
                <ResultCard place={filteredAndSortedResults[0]} isHero />
              </div>
            )}

            {/* Alternatives */}
            {filteredAndSortedResults.length > 1 && (
              <div className="mt-8">
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Strong Alternatives</h3>
                <div className="space-y-4">
                  {filteredAndSortedResults.slice(1).map((place) => (
                    <ResultCard key={place.placeId} place={place} />
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="h-full w-full rounded-2xl overflow-hidden border border-gray-200 shadow-sm relative z-0">
            <MapContainer center={mapCenter} zoom={13} scrollWheelZoom={true} className="h-full w-full">
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <MapUpdater center={mapCenter} />
              
              {lat && lng && (
                <Marker position={[lat, lng]}>
                  <Popup>
                    <div className="font-semibold">Your Location</div>
                  </Popup>
                </Marker>
              )}

              {filteredAndSortedResults.map((place) => (
                <Marker key={place.placeId} position={[place.lat, place.lng]}>
                  <Popup>
                    <div className="p-1">
                      <h3 className="font-bold text-gray-900">{place.name}</h3>
                      <p className="text-sm text-gray-500 mb-2">{place.category} • {place.distanceMiles.toFixed(1)} mi</p>
                      <div className="flex items-center gap-1 mb-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${place.isOpen ? 'bg-green-50 text-green-700' : 'bg-gray-50 text-gray-500'}`}>
                          {place.openStatusText}
                        </span>
                      </div>
                      <button 
                        onClick={() => navigate(`/place/${place.placeId}`, { state: { place } })}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white py-1.5 rounded-lg text-sm font-medium transition-colors"
                      >
                        View Details
                      </button>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>
        )}
        </div>
      </div>
      
      <VoiceSearchOverlay isOpen={isVoiceOpen} onClose={() => setIsVoiceOpen(false)} />
    </div>
  );
}

function FilterChip({ label, active = false, onClick }: { label: string, active?: boolean, onClick?: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={`whitespace-nowrap px-4 py-1.5 rounded-full text-sm font-medium border transition-colors ${active ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'}`}
    >
      {label}
    </button>
  );
}

function ResultCard({ place, isHero = false }: { place: PlaceResult, isHero?: boolean, key?: React.Key }) {
  const navigate = useNavigate();
  const { lat: currentLat, lng: currentLng } = useLocationContext();
  
  const [showDirections, setShowDirections] = useState(false);
  const [routeData, setRouteData] = useState<any>(null);
  const [routeLoading, setRouteLoading] = useState(false);
  const [startAddress, setStartAddress] = useState(currentLat && currentLng ? 'Your Current Location' : '');
  const [startCoords, setStartCoords] = useState<[number, number] | null>(currentLat && currentLng ? [currentLat, currentLng] : null);

  const statusColor = place.isOpen ? 'text-green-600' : 'text-gray-500';
  const statusBg = place.isOpen ? 'bg-green-50' : 'bg-gray-50';

  const fetchRoute = async (lat: number, lng: number) => {
    setRouteLoading(true);
    try {
      const res = await fetch(`https://router.project-osrm.org/route/v1/driving/${lng},${lat};${place.lng},${place.lat}?overview=full&geometries=geojson&steps=true`);
      const data = await res.json();
      if (data.routes && data.routes.length > 0) {
        setRouteData(data.routes[0]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setRouteLoading(false);
    }
  };

  const handleAddressSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!startAddress.trim()) return;
    setRouteLoading(true);
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(startAddress)}`);
      const data = await res.json();
      if (data && data.length > 0) {
        const newLat = parseFloat(data[0].lat);
        const newLng = parseFloat(data[0].lon);
        setStartCoords([newLat, newLng]);
        fetchRoute(newLat, newLng);
      } else {
        alert("Address not found. Please try again.");
        setRouteLoading(false);
      }
    } catch (err) {
      console.error(err);
      setRouteLoading(false);
    }
  };

  const getInstruction = (step: any) => {
    const type = step.maneuver.type.replace(/-/g, ' ');
    const modifier = step.maneuver.modifier ? step.maneuver.modifier.replace(/-/g, ' ') : '';
    const name = step.name;
    
    let instruction = type;
    if (modifier && type !== modifier) instruction += ` ${modifier}`;
    if (name) instruction += ` onto ${name}`;
    
    return instruction.charAt(0).toUpperCase() + instruction.slice(1);
  };

  return (
    <div 
      onClick={() => navigate(`/place/${place.placeId}`, { state: { place } })}
      className={`bg-white rounded-2xl border ${isHero ? 'border-blue-200 shadow-md p-6' : 'border-gray-200 shadow-sm p-4'} cursor-pointer hover:shadow-lg transition-shadow relative overflow-hidden`}
    >
      {isHero && <div className="absolute top-0 left-0 w-full h-1 bg-blue-600"></div>}
      
      <div className="flex justify-between items-start mb-2">
        <div className="w-full">
          <h2 className={`${isHero ? 'text-2xl' : 'text-lg'} font-bold text-gray-900 leading-tight break-words`}>{place.name}</h2>
          <p className="text-gray-500 text-sm mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
            <span>{place.category}</span>
            <span>•</span>
            <span>{place.distanceMiles.toFixed(1)} mi</span>
            {place.rating && (
              <>
                <span>•</span>
                <span className="flex items-center text-amber-500">
                  <Star size={14} className="fill-current mr-1" />
                  {place.rating}
                </span>
              </>
            )}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mt-3 mb-4">
        <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-sm font-medium ${statusBg} ${statusColor}`}>
          <Clock size={14} className="mr-1.5" />
          {place.openStatusText}
        </span>
        <span className="inline-flex items-center px-2.5 py-1 rounded-md text-sm font-medium bg-blue-50 text-blue-700">
          <CheckCircle2 size={14} className="mr-1.5" />
          {place.confidenceLabel}
        </span>
      </div>

      {place.recommendationReason && (
        <p className={`text-sm text-gray-600 mb-4 ${isHero ? 'bg-gray-50 p-3 rounded-lg border border-gray-100' : ''}`}>
          {place.recommendationReason}
        </p>
      )}

      <div className="flex flex-wrap sm:flex-nowrap gap-2 mt-4 pt-4 border-t border-gray-100">
        <button 
          onClick={(e) => { 
            e.stopPropagation(); 
            const willShow = !showDirections;
            setShowDirections(willShow);
            if (willShow && startCoords && !routeData) {
              fetchRoute(startCoords[0], startCoords[1]);
            }
          }}
          className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-2.5 px-3 rounded-xl font-medium transition-colors min-w-[120px]"
        >
          <Navigation size={18} />
          {showDirections ? 'Hide Directions' : 'Directions'}
        </button>
        {place.phone && (
          <button 
            onClick={(e) => { e.stopPropagation(); window.open(`tel:${place.phone}`); }}
            className="flex-1 flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-900 py-2.5 px-3 rounded-xl font-medium transition-colors min-w-[100px]"
          >
            <Phone size={18} />
            Call
          </button>
        )}
        <button 
          onClick={(e) => { e.stopPropagation(); /* Save logic */ }}
          className="p-2.5 bg-gray-100 hover:bg-gray-200 text-gray-900 rounded-xl transition-colors shrink-0"
        >
          <Bookmark size={18} />
        </button>
      </div>

      {showDirections && (
        <div className="mt-4 pt-4 border-t border-gray-100" onClick={(e) => e.stopPropagation()}>
          <h3 className="font-semibold text-gray-900 mb-3">Directions to {place.name}</h3>
          
          <form onSubmit={handleAddressSubmit} className="flex gap-2 mb-4">
            <input 
              type="text" 
              value={startAddress}
              onChange={(e) => setStartAddress(e.target.value)}
              placeholder="Enter starting address..."
              className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            />
            <button type="submit" className="px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800">
              Update
            </button>
          </form>

          {routeLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : routeData && startCoords ? (
            <div className="space-y-4">
              <div className="h-48 w-full rounded-xl overflow-hidden border border-gray-200 relative z-0">
                <MapContainer 
                  bounds={[
                    [startCoords[0], startCoords[1]],
                    [place.lat, place.lng]
                  ]} 
                  zoom={13} 
                  scrollWheelZoom={false} 
                  className="h-full w-full"
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  <Marker position={[startCoords[0], startCoords[1]]}>
                    <Popup>Start</Popup>
                  </Marker>
                  <Marker position={[place.lat, place.lng]}>
                    <Popup>Destination</Popup>
                  </Marker>
                  <Polyline 
                    positions={routeData.geometry.coordinates.map((c: any) => [c[1], c[0]])} 
                    color="#2563eb" 
                    weight={4} 
                  />
                </MapContainer>
              </div>
              
              <div className="bg-gray-50 rounded-xl p-4 max-h-60 overflow-y-auto">
                <div className="font-medium text-gray-900 mb-3 pb-2 border-b border-gray-200">
                  {(routeData.distance / 1609.34).toFixed(1)} miles • {Math.round(routeData.duration / 60)} min
                </div>
                <ol className="space-y-3 text-sm text-gray-700 list-decimal list-inside">
                  {routeData.legs[0].steps.map((step: any, idx: number) => (
                    <li key={idx} className="pl-2">
                      <span>{getInstruction(step)}</span>
                      {step.distance > 0 && <span className="text-gray-500 ml-1">({(step.distance / 1609.34).toFixed(1)} mi)</span>}
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500 text-sm">
              Enter a starting location to see directions.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
