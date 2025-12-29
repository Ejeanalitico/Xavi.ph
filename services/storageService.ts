import { BookingRecord, Package, AddOnOptions, AddOnLabels, LocationItem, ClientUser, PortfolioItem, VisitorStat } from '../types';

// --- INDEXED DB SETUP FOR LARGE IMAGES ---
const DB_NAME = 'XaviPhDB';
const STORE_NAME = 'images';

const initDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
  });
};

const ImageStore = {
  save: async (data: string): Promise<string> => {
    // If it's a short URL (not base64), return as is
    if (data.length < 500 && !data.startsWith('data:')) return data;
    
    const id = `img_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(data, id);
      req.onsuccess = () => resolve(`idb::${id}`);
      req.onerror = () => reject(req.error);
    });
  },
  get: async (key: string): Promise<string> => {
    if (!key.startsWith('idb::')) return key;
    const id = key.replace('idb::', '');
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(id);
      req.onsuccess = () => resolve(req.result || ''); // Return empty if not found
      req.onerror = () => reject(req.error);
    });
  },
  delete: async (key: string): Promise<void> => {
    if (!key.startsWith('idb::')) return;
    const id = key.replace('idb::', '');
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.delete(id);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }
};

// Mock Data Configuration
const INITIAL_PACKAGES: Package[] = [
  {
    id: 'pkg_wedding_lux',
    category: 'Boda',
    name: 'Boda Luxury',
    price: 25000,
    description: 'Cobertura completa de tu día especial, desde los preparativos hasta la fiesta.',
    includes: ['Cobertura 12 horas', '2 Fotógrafos', 'Entrega digital 800 fotos', 'Video Highlight 5min'],
    coverImage: 'https://picsum.photos/id/1059/800/600',
  },
  {
    id: 'pkg_wedding_ess',
    category: 'Boda',
    name: 'Boda Essential',
    price: 15000,
    description: 'Lo esencial para capturar los momentos clave.',
    includes: ['Cobertura 6 horas', '1 Fotógrafo', 'Entrega digital 400 fotos'],
    coverImage: 'https://picsum.photos/id/1011/800/600',
  },
  {
    id: 'pkg_xv_dream',
    category: 'XV Años',
    name: 'XV Dream',
    price: 18000,
    description: 'Capturando la magia de tus 15 años.',
    includes: ['Sesión previa', 'Cobertura evento 8 horas', 'Photobook 20 páginas'],
    coverImage: 'https://picsum.photos/id/342/800/600',
  },
  {
    id: 'pkg_portrait_studio',
    category: 'Retrato',
    name: 'Sesión Estudio',
    price: 3500,
    description: 'Sesión profesional en Estudio Xavi.Ph.',
    includes: ['1 hora de sesión', '2 Cambios de ropa', '10 Fotos editadas High-End'],
    coverImage: 'https://picsum.photos/id/338/800/600',
  },
  {
    id: 'pkg_event_social',
    category: 'Evento',
    name: 'Social Event',
    price: 8000,
    description: 'Cobertura para bautizos, cumpleaños o graduaciones.',
    includes: ['Cobertura 5 horas', 'Entrega ilimitada digital', 'Galería web privada'],
    coverImage: 'https://picsum.photos/id/452/800/600',
  }
];

export const DEFAULT_CATEGORY_IMAGES: Record<string, string> = {
    'Boda': 'https://picsum.photos/id/1059/800/600',
    'XV Años': 'https://picsum.photos/id/342/800/600',
    'Retrato': 'https://picsum.photos/id/338/800/600',
    'Evento': 'https://picsum.photos/id/452/800/600'
};

const INITIAL_ADDON_PRICES: AddOnOptions = {
  canvas: { small: 800, medium: 1500, large: 2500 },
  photobook: { pages20: 3000, pages40: 4500, pages60: 6000 },
  prints: { set10: 200, set20: 350, set50: 800 },
};

const INITIAL_ADDON_LABELS: AddOnLabels = {
  canvas: { small: 'Chico', medium: 'Mediano', large: 'Grande' },
  photobook: { pages20: '20 Pág', pages40: '40 Pág', pages60: '60 Pág' },
  prints: { set10: 'Set 10', set20: 'Set 20', set50: 'Set 50' },
};

export const LOCATIONS: LocationItem[] = [
  { name: 'Fuentes Brotantes', description: 'Naturaleza boscosa y lago sereno.' },
  { name: 'Parque Bicentenario', description: 'Jardines temáticos y arquitectura moderna.' },
  { name: 'Parque Hundido', description: 'Reloj floral y rutas arqueológicas.' },
  { name: 'Parque Masayoshi Ohira', description: 'Estilo japonés tradicional con puentes y estanques.' },
  { name: 'Monumento a la Revolución', description: 'Urbano, imponente y con vistas panorámicas.' },
  { name: 'Kiosco Morisco', description: 'Detalles geométricos y colores vibrantes.' },
  { name: 'Estudio Xavi.Ph', description: 'Iluminación controlada y fondos profesionales.', note: 'Ubicado en Roma Norte.' },
];

const STORAGE_KEYS = {
  BOOKINGS: 'xaviph_bookings',
  PACKAGES: 'xaviph_packages',
  ADDONS: 'xaviph_addons',
  ADDON_LABELS: 'xaviph_addon_labels',
  CLIENTS: 'xaviph_clients',
  PORTFOLIO: 'xaviph_portfolio',
  BRANDING: 'xaviph_branding',
  TRAFFIC_LOG: 'xaviph_traffic_log',
  CATEGORY_COVERS: 'xaviph_cat_covers',
  HOME_HERO: 'xaviph_home_hero',
  STATS_SOURCES: 'xaviph_stats_sources',
  STATS_CATS: 'xaviph_stats_cats',
  STATS_PKGS: 'xaviph_stats_pkgs'
};

// In-memory fallback
const memoryStorage: Record<string, string> = {};

const safeSetItem = (key: string, value: string) => {
    try {
        localStorage.setItem(key, value);
        if (memoryStorage[key]) delete memoryStorage[key];
    } catch (e) {
        console.warn(`LocalStorage quota exceeded for ${key}. Using memory storage.`);
        memoryStorage[key] = value;
    }
};

const safeGetItem = (key: string): string | null => {
    return memoryStorage[key] || localStorage.getItem(key);
};

export const StorageService = {
  // Helper to load async image
  resolveImage: async (urlOrKey: string): Promise<string> => {
      if (!urlOrKey) return '';
      return await ImageStore.get(urlOrKey);
  },

  // Home Hero
  getHomeHero: async (): Promise<string> => {
      const stored = safeGetItem(STORAGE_KEYS.HOME_HERO);
      if (stored) return await ImageStore.get(stored);
      return 'https://picsum.photos/id/433/1920/1080?grayscale';
  },

  updateHomeHero: async (dataUrl: string) => {
      const key = await ImageStore.save(dataUrl);
      safeSetItem(STORAGE_KEYS.HOME_HERO, key);
  },

  // Category Covers
  getCategoryCovers: (): Record<string, string> => {
      const stored = safeGetItem(STORAGE_KEYS.CATEGORY_COVERS);
      return stored ? JSON.parse(stored) : DEFAULT_CATEGORY_IMAGES;
  },

  updateCategoryCover: async (category: string, url: string) => {
      const covers = StorageService.getCategoryCovers();
      const key = await ImageStore.save(url); // Save to IDB
      covers[category] = key;
      safeSetItem(STORAGE_KEYS.CATEGORY_COVERS, JSON.stringify(covers));
  },
  
  deleteCategory: (category: string) => {
      const covers = StorageService.getCategoryCovers();
      delete covers[category];
      safeSetItem(STORAGE_KEYS.CATEGORY_COVERS, JSON.stringify(covers));
  },

  // Packages
  getPackages: (): Package[] => {
    const stored = safeGetItem(STORAGE_KEYS.PACKAGES);
    if (stored) return JSON.parse(stored);
    safeSetItem(STORAGE_KEYS.PACKAGES, JSON.stringify(INITIAL_PACKAGES));
    return INITIAL_PACKAGES;
  },

  updatePackage: (pkg: Package) => {
    const packages = StorageService.getPackages();
    const index = packages.findIndex(p => p.id === pkg.id);
    if (index !== -1) {
      packages[index] = pkg;
      safeSetItem(STORAGE_KEYS.PACKAGES, JSON.stringify(packages));
    }
  },

  addPackage: (pkg: Package) => {
    const packages = StorageService.getPackages();
    packages.push(pkg);
    safeSetItem(STORAGE_KEYS.PACKAGES, JSON.stringify(packages));
  },

  deletePackage: (id: string) => {
      let packages = StorageService.getPackages();
      packages = packages.filter(p => p.id !== id);
      safeSetItem(STORAGE_KEYS.PACKAGES, JSON.stringify(packages));
  },

  // Addons
  getAddonPrices: (): AddOnOptions => {
    const stored = safeGetItem(STORAGE_KEYS.ADDONS);
    if (stored) return JSON.parse(stored);
    safeSetItem(STORAGE_KEYS.ADDONS, JSON.stringify(INITIAL_ADDON_PRICES));
    return INITIAL_ADDON_PRICES;
  },

  updateAddonPrices: (prices: AddOnOptions) => {
    safeSetItem(STORAGE_KEYS.ADDONS, JSON.stringify(prices));
  },

  getAddonLabels: (): AddOnLabels => {
    const stored = safeGetItem(STORAGE_KEYS.ADDON_LABELS);
    if (stored) return JSON.parse(stored);
    safeSetItem(STORAGE_KEYS.ADDON_LABELS, JSON.stringify(INITIAL_ADDON_LABELS));
    return INITIAL_ADDON_LABELS;
  },

  updateAddonLabels: (labels: AddOnLabels) => {
    safeSetItem(STORAGE_KEYS.ADDON_LABELS, JSON.stringify(labels));
  },

  // Bookings
  addBooking: (booking: BookingRecord) => {
    const current = StorageService.getBookings();
    const updated = [booking, ...current];
    safeSetItem(STORAGE_KEYS.BOOKINGS, JSON.stringify(updated));
    return true;
  },

  getBookings: (): BookingRecord[] => {
    const stored = safeGetItem(STORAGE_KEYS.BOOKINGS);
    return stored ? JSON.parse(stored) : [];
  },

  updateBookingStatus: (id: string, status: BookingRecord['status']) => {
    const bookings = StorageService.getBookings();
    const idx = bookings.findIndex(b => b.id === id);
    if (idx !== -1) {
      bookings[idx].status = status;
      safeSetItem(STORAGE_KEYS.BOOKINGS, JSON.stringify(bookings));
    }
  },

  // Clients with Async Storage
  addClient: async (client: ClientUser) => {
    const clients = StorageService.getClients();
    
    // Process images to IndexedDB
    const processedImages: string[] = [];
    for (const img of client.galleryImages) {
        const key = await ImageStore.save(img);
        processedImages.push(key);
    }
    const processedClient = { ...client, galleryImages: processedImages };

    if (clients.some(c => c.email === client.email)) {
        const idx = clients.findIndex(c => c.email === client.email);
        // Merge: keep existing photos + new ones
        const existing = clients[idx];
        const combinedImages = [...existing.galleryImages, ...processedImages];
        clients[idx] = { ...existing, ...client, galleryImages: combinedImages };
    } else {
        clients.push(processedClient);
    }
    
    safeSetItem(STORAGE_KEYS.CLIENTS, JSON.stringify(clients));
    return true;
  },

  removeClient: (email: string) => {
      let clients = StorageService.getClients();
      clients = clients.filter(c => c.email !== email);
      safeSetItem(STORAGE_KEYS.CLIENTS, JSON.stringify(clients));
  },

  getClients: (): ClientUser[] => {
    const stored = safeGetItem(STORAGE_KEYS.CLIENTS);
    return stored ? JSON.parse(stored) : [];
  },

  getClientByEmail: (email: string): ClientUser | undefined => {
      return StorageService.getClients().find(c => c.email === email);
  },

  validateClient: (email: string, pass: string): boolean => {
    const clients = StorageService.getClients();
    return clients.some(c => c.email === email && c.password === pass);
  },
  
  updateClientSelection: (email: string, photoIds: string[]) => {
      const clients = StorageService.getClients();
      const idx = clients.findIndex(c => c.email === email);
      if (idx !== -1) {
          clients[idx].selectedPhotos = photoIds;
          safeSetItem(STORAGE_KEYS.CLIENTS, JSON.stringify(clients));
      }
  },

  // Portfolio with Async Storage
  getPortfolio: (): PortfolioItem[] => {
      const stored = safeGetItem(STORAGE_KEYS.PORTFOLIO);
      return stored ? JSON.parse(stored) : [];
  },
  
  addToPortfolio: async (item: PortfolioItem) => {
      const portfolio = StorageService.getPortfolio();
      const key = await ImageStore.save(item.url);
      portfolio.push({ ...item, url: key });
      safeSetItem(STORAGE_KEYS.PORTFOLIO, JSON.stringify(portfolio));
  },

  removePortfolioItem: async (id: string) => {
      let portfolio = StorageService.getPortfolio();
      const item = portfolio.find(p => p.id === id);
      if (item) {
          await ImageStore.delete(item.url);
          portfolio = portfolio.filter(p => p.id !== id);
          safeSetItem(STORAGE_KEYS.PORTFOLIO, JSON.stringify(portfolio));
      }
  },

  // Branding
  getLogo: (): string | null => {
      return safeGetItem(STORAGE_KEYS.BRANDING + '_logo');
  },
  
  setLogo: (dataUrl: string) => {
      safeSetItem(STORAGE_KEYS.BRANDING + '_logo', dataUrl);
  },

  // Traffic & Analytics
  recordVisit: (source: string = 'Directo') => {
    const today = new Date().toISOString().split('T')[0];
    
    // Visits by Date
    const log = safeGetItem(STORAGE_KEYS.TRAFFIC_LOG);
    const trafficData: Record<string, number> = log ? JSON.parse(log) : {};
    trafficData[today] = (trafficData[today] || 0) + 1;
    safeSetItem(STORAGE_KEYS.TRAFFIC_LOG, JSON.stringify(trafficData));

    // Visits by Source
    const sourcesLog = safeGetItem(STORAGE_KEYS.STATS_SOURCES);
    const sourcesData: Record<string, number> = sourcesLog ? JSON.parse(sourcesLog) : {};
    sourcesData[source] = (sourcesData[source] || 0) + 1;
    safeSetItem(STORAGE_KEYS.STATS_SOURCES, JSON.stringify(sourcesData));
  },

  trackCategoryView: (category: string) => {
      const log = safeGetItem(STORAGE_KEYS.STATS_CATS);
      const data: Record<string, number> = log ? JSON.parse(log) : {};
      data[category] = (data[category] || 0) + 1;
      safeSetItem(STORAGE_KEYS.STATS_CATS, JSON.stringify(data));
  },

  trackPackageView: (pkgName: string) => {
      const log = safeGetItem(STORAGE_KEYS.STATS_PKGS);
      const data: Record<string, number> = log ? JSON.parse(log) : {};
      data[pkgName] = (data[pkgName] || 0) + 1;
      safeSetItem(STORAGE_KEYS.STATS_PKGS, JSON.stringify(data));
  },

  getTrafficStats: (frequency: 'weekly' | 'monthly' | 'yearly' = 'weekly'): { 
      visits: VisitorStat[], 
      sources: VisitorStat[],
      topCategories: VisitorStat[],
      topPackages: VisitorStat[]
  } => {
    // Visits
    const log = safeGetItem(STORAGE_KEYS.TRAFFIC_LOG);
    const trafficData: Record<string, number> = log ? JSON.parse(log) : {};
    let visits: VisitorStat[] = [];
    
    if (frequency === 'weekly') {
        const today = new Date();
        for (let i = 6; i >= 0; i--) {
            const d = new Date(today);
            d.setDate(today.getDate() - i);
            const dateStr = d.toISOString().split('T')[0];
            const dayName = d.toLocaleDateString('es-MX', { weekday: 'short' });
            visits.push({ name: dayName, value: trafficData[dateStr] || 0 });
        }
    } else {
        const today = new Date();
        const year = today.getFullYear();
        // Simplified monthly
         visits = [
            { name: 'Ene', value: 0 }, { name: 'Feb', value: 0 }, { name: 'Mar', value: 0 },
            { name: 'Abr', value: 0 }, { name: 'May', value: 0 }, { name: 'Jun', value: 0 }
        ];
    }

    // Sources
    const sourcesLog = safeGetItem(STORAGE_KEYS.STATS_SOURCES);
    const sourcesData: Record<string, number> = sourcesLog ? JSON.parse(sourcesLog) : {};
    const sources = Object.entries(sourcesData).map(([name, value]) => ({ name, value }));

    // Top Categories
    const catsLog = safeGetItem(STORAGE_KEYS.STATS_CATS);
    const catsData: Record<string, number> = catsLog ? JSON.parse(catsLog) : {};
    const topCategories = Object.entries(catsData)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([name, value]) => ({ name, value }));

    // Top Packages
    const pkgsLog = safeGetItem(STORAGE_KEYS.STATS_PKGS);
    const pkgsData: Record<string, number> = pkgsLog ? JSON.parse(pkgsLog) : {};
    const topPackages = Object.entries(pkgsData)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([name, value]) => ({ name, value }));

    return { visits, sources, topCategories, topPackages };
  },
  
  sendGallerySelection: (email: string, photoIds: string[]) => {
      StorageService.updateClientSelection(email, photoIds);
      console.log(`[EMAIL SERVICE] Notification sent to admin regarding selection by ${email}.`);
      return true;
  }
};
