import React, { createContext, useContext, useState } from 'react';
import { useGeolocation } from '../hooks/useGeolocation';

interface LocationContextType {
  lat: number | null;
  lng: number | null;
  address: string;
  loading: boolean;
  error: string | null;
  setManualLocation: (address: string, lat: number, lng: number) => void;
  useDeviceLocation: () => void;
}

const LocationContext = createContext<LocationContextType>({
  lat: null, lng: null, address: 'Current Location', loading: true, error: null,
  setManualLocation: () => {}, useDeviceLocation: () => {}
});

export function LocationProvider({ children }: { children: React.ReactNode }) {
  const deviceLoc = useGeolocation();
  const [manualLoc, setManualLoc] = useState<{lat: number, lng: number, address: string} | null>(null);

  const setManualLocation = (address: string, lat: number, lng: number) => {
    setManualLoc({ lat, lng, address });
  };

  const useDeviceLocation = () => {
    setManualLoc(null);
  };

  const value = manualLoc ? {
    lat: manualLoc.lat,
    lng: manualLoc.lng,
    address: manualLoc.address,
    loading: false,
    error: null,
    setManualLocation,
    useDeviceLocation
  } : {
    lat: deviceLoc.lat || 39.9526,
    lng: deviceLoc.lng || -75.1652,
    address: deviceLoc.lat ? 'Current Location' : (deviceLoc.error ? 'Philadelphia, PA' : 'Locating...'),
    loading: deviceLoc.loading && !deviceLoc.lat,
    error: deviceLoc.error,
    setManualLocation,
    useDeviceLocation
  };

  return <LocationContext.Provider value={value}>{children}</LocationContext.Provider>;
}

export const useLocationContext = () => useContext(LocationContext);
