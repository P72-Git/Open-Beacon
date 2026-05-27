import { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, Navigation, Phone, Globe, Clock, Star, MapPin, CheckCircle2, AlertTriangle, MessageSquare, ThumbsUp, ThumbsDown } from 'lucide-react';
import { PlaceResult } from '../types';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';

export default function PlaceDetail() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const place = location.state?.place as PlaceResult | undefined;

  // In a real app, we'd fetch place details if not in state
  if (!place) {
    return <div className="p-8 text-center">Place not found</div>;
  }

  const statusColor = place.isOpen ? 'text-green-600' : 'text-gray-500';
  const statusBg = place.isOpen ? 'bg-green-50' : 'bg-gray-50';

  return (
    <div className="max-w-2xl mx-auto bg-white min-h-screen md:border-x border-gray-200 md:ml-64">
      <header className="sticky top-0 bg-white/80 backdrop-blur-md z-10 border-b border-gray-100 px-4 py-3 flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
          <ArrowLeft size={24} className="text-gray-900" />
        </button>
        <h1 className="text-lg font-semibold text-gray-900 truncate">{place.name}</h1>
      </header>

      <div className="p-4 md:p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{place.name}</h1>
          <div className="flex items-center gap-2 text-gray-500 text-sm mb-4">
            <span>{place.category}</span>
            <span>•</span>
            <span className="flex items-center text-amber-500">
              <Star size={16} className="fill-current mr-1" />
              {place.rating || 'New'}
            </span>
            <span>•</span>
            <span>{place.distanceMiles.toFixed(1)} mi away</span>
          </div>

          <div className="flex flex-wrap gap-2 mb-6">
            <span className={`inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-medium ${statusBg} ${statusColor}`}>
              <Clock size={16} className="mr-2" />
              {place.openStatusText}
            </span>
            <span className="inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-medium bg-blue-50 text-blue-700">
              <CheckCircle2 size={16} className="mr-2" />
              {place.confidenceLabel}
            </span>
          </div>

          <div className="flex gap-3">
            <button 
              onClick={() => window.open(`https://maps.google.com/?q=${place.lat},${place.lng}`)}
              className="flex-1 flex flex-col items-center justify-center gap-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-2xl font-medium transition-colors"
            >
              <Navigation size={20} />
              <span className="text-xs">Directions</span>
            </button>
            {place.phone && (
              <button 
                onClick={() => window.open(`tel:${place.phone}`)}
                className="flex-1 flex flex-col items-center justify-center gap-1 bg-gray-100 hover:bg-gray-200 text-gray-900 py-3 rounded-2xl font-medium transition-colors"
              >
                <Phone size={20} />
                <span className="text-xs">Call</span>
              </button>
            )}
            {place.website && (
              <button 
                onClick={() => window.open(place.website)}
                className="flex-1 flex flex-col items-center justify-center gap-1 bg-gray-100 hover:bg-gray-200 text-gray-900 py-3 rounded-2xl font-medium transition-colors"
              >
                <Globe size={20} />
                <span className="text-xs">Website</span>
              </button>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <section className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Why we recommend this</h2>
            <p className="text-gray-900">{place.recommendationReason || 'This is the best overall option near you right now based on open status, distance, and reliability.'}</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
              <MapPin size={20} className="text-gray-400" />
              Location
            </h2>
            <p className="text-gray-700">{place.address}</p>
            <div className="w-full h-48 bg-gray-200 rounded-2xl mt-3 overflow-hidden border border-gray-200 relative z-0">
              <MapContainer center={[place.lat, place.lng]} zoom={15} scrollWheelZoom={false} className="h-full w-full">
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <Marker position={[place.lat, place.lng]}>
                  <Popup>{place.name}</Popup>
                </Marker>
              </MapContainer>
            </div>
          </section>

          {place.weeklyHours && place.weeklyHours.length > 0 && (
            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                <Clock size={20} className="text-gray-400" />
                Hours
              </h2>
              <ul className="space-y-2 text-gray-700">
                {place.weeklyHours.map((hours, i) => (
                  <li key={i} className="flex justify-between text-sm">
                    <span>{hours}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
