export interface User {
  uid: string;
  name: string;
  email: string;
  photoUrl?: string;
  role: 'user' | 'admin';
  createdAt: Date;
}

export interface SavedPlace {
  placeId: string;
  name: string;
  address: string;
  category: string;
  savedAt: Date;
}

export interface RecentSearch {
  query: string;
  searchedAt: Date;
}

export interface Confirmation {
  placeId: string;
  userId: string;
  status: 'open' | 'closed' | 'busy' | 'quiet';
  note?: string;
  reportedAt: Date;
}

export interface PlaceResult {
  placeId: string;
  name: string;
  category: string;
  address: string;
  distanceMiles: number;
  isOpen: boolean;
  openStatusText: string;
  rating?: number;
  confidenceLabel: 'Highly reliable' | 'Likely open' | 'Hours may vary' | 'Call to confirm';
  recommendationReason?: string;
  lat: number;
  lng: number;
  phone?: string;
  website?: string;
  weeklyHours?: string[];
  is247?: boolean;
}
