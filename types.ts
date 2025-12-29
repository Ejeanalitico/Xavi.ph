export type ExperienceCategory = 'Boda' | 'XV Años' | 'Retrato' | 'Evento' | 'Comercial';

export interface Package {
  id: string;
  category: ExperienceCategory;
  name: string;
  price: number;
  description: string;
  includes: string[];
  coverImage: string;
}

export interface AddOnOptions {
  canvas: {
    small: number;
    medium: number;
    large: number;
  };
  photobook: {
    pages20: number;
    pages40: number;
    pages60: number;
  };
  prints: {
    set10: number;
    set20: number;
    set50: number;
  };
}

export interface AddOnLabels {
  canvas: {
    small: string;
    medium: string;
    large: string;
  };
  photobook: {
    pages20: string;
    pages40: string;
    pages60: string;
  };
  prints: {
    set10: string;
    set20: string;
    set50: string;
  };
}

export interface ClientUser {
  email: string;
  password: string;
  galleryImages: string[]; // Base64 or URLs
  selectedPhotos?: string[]; // IDs of photos selected by client
}

export interface PortfolioItem {
  id: string;
  url: string;
  title?: string;
  category: string;
}

export interface BookingState {
  canvasSize: 'none' | 'small' | 'medium' | 'large';
  photobookSize: 'none' | 'pages20' | 'pages40' | 'pages60';
  printSet: 'none' | 'set10' | 'set20' | 'set50';
  clientName: string;
  datePrimary: string;
  dateSecondary: string; // Used for "Boda" (Religious vs Civil)
}

export interface BookingRecord {
  id: string;
  clientName: string;
  packageId: string;
  packageName: string;
  totalPrice: number;
  status: 'Pendiente' | 'Aceptada' | 'Rechazada';
  dates: {
    primary: string; // Or Civil
    secondary?: string; // Religious
  };
  addOns: {
    canvas: string;
    photobook: string;
    prints: string;
  };
  timestamp: number;
}

export interface LocationItem {
  name: string;
  description: string;
  note?: string;
}

export interface VisitorStat {
  name: string;
  value: number;
}
