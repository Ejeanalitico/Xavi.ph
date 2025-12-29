import React, { useState, useEffect } from 'react';
import { Package, BookingState, BookingRecord, PortfolioItem } from '../types';
import { StorageService, LOCATIONS } from '../services/storageService';
import Calculator from '../components/Calculator';
import { MapPin, Calendar as CalendarIcon, Phone, Check, ArrowLeft, ExternalLink, Camera, Star, Heart, Music, Aperture } from 'lucide-react';

const Home: React.FC = () => {
  // View State: 'categories' -> 'list' -> 'details'
  const [viewState, setViewState] = useState<'categories' | 'list' | 'details'>('categories');
  const [activeCategory, setActiveCategory] = useState<string>('');
  
  const [packages] = useState<Package[]>(StorageService.getPackages());
  const [catCovers, setCatCovers] = useState<Record<string, string>>({});
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([]);
  const [selectedPackage, setSelectedPackage] = useState<Package | null>(null);
  const [totalPrice, setTotalPrice] = useState<number>(0);
  const [logo, setLogo] = useState<string | null>(null);
  const [heroImage, setHeroImage] = useState<string>('https://picsum.photos/id/433/1920/1080?grayscale');
  
  // Portfolio Filter
  const [activePortCategory, setActivePortCategory] = useState<string>('Todos');
  
  const [booking, setBooking] = useState<BookingState>({
    canvasSize: 'none',
    photobookSize: 'none',
    printSet: 'none',
    clientName: '',
    datePrimary: '',
    dateSecondary: '',
  });

  useEffect(() => {
    // Async load portfolio images
    const loadPortfolio = async () => {
        const raw = StorageService.getPortfolio();
        const resolved = await Promise.all(raw.map(async (p) => ({
            ...p,
            url: await StorageService.resolveImage(p.url)
        })));
        setPortfolio(resolved);
    };
    loadPortfolio();

    // Async load category covers
    const loadCovers = async () => {
        const raw = StorageService.getCategoryCovers();
        const resolved: Record<string, string> = {};
        for(const [k, v] of Object.entries(raw)) {
            resolved[k] = await StorageService.resolveImage(v);
        }
        setCatCovers(resolved);
    };
    loadCovers();

    // Async load Home Hero
    const loadHero = async () => {
        const url = await StorageService.getHomeHero();
        setHeroImage(url);
    };
    loadHero();

    const savedLogo = StorageService.getLogo();
    if (savedLogo) setLogo(savedLogo);
    
    // Track Visit & Source
    let source = 'Directo';
    const ref = document.referrer;
    if (ref) {
        if (ref.includes('facebook.com')) source = 'Facebook';
        else if (ref.includes('instagram.com')) source = 'Instagram';
        else if (ref.includes('google.com')) source = 'Google';
        else if (ref.includes('tiktok.com')) source = 'TikTok';
        else source = 'Referido (Web)';
    }
    // Also check URL params for explicit tracking (e.g. from ads)
    const urlParams = new URLSearchParams(window.location.search);
    const urlSource = urlParams.get('source') || urlParams.get('ref');
    if (urlSource) source = urlSource;

    StorageService.recordVisit(source);
  }, []);

  // Filter Logic
  const filteredPackages = packages.filter(p => p.category === activeCategory);
  
  const filteredPortfolio = activePortCategory === 'Todos'
    ? portfolio
    : portfolio.filter(p => p.category === activePortCategory);

  const portCategories = ['Todos', ...new Set(portfolio.map(p => p.category || 'General'))];

  // Get current accepted bookings
  const acceptedBookings = StorageService.getBookings().filter(b => b.status === 'Aceptada');

  const handleBookingChange = (field: keyof BookingState, value: string) => {
    setBooking(prev => ({ ...prev, [field]: value }));
  };

  const handleCategorySelect = (category: string) => {
      setActiveCategory(category);
      setViewState('list');
      StorageService.trackCategoryView(category);
      window.scrollTo({ top: document.getElementById('experiencias')?.offsetTop || 0, behavior: 'smooth' });
  };

  const handlePackageSelect = (pkg: Package) => {
      setSelectedPackage(pkg);
      setTotalPrice(pkg.price);
      setViewState('details');
      StorageService.trackPackageView(pkg.name);
      window.scrollTo({ top: document.getElementById('booking-form')?.offsetTop || 0, behavior: 'smooth' });
  };

  const handleBackToCategories = () => {
      setViewState('categories');
      setSelectedPackage(null);
  };

  const handleBackToList = () => {
      setViewState('list');
      setSelectedPackage(null);
  };

  const handleBookingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPackage) return;
    if (!booking.clientName || !booking.datePrimary) {
      alert("Por favor completa el nombre y la fecha principal.");
      return;
    }
    if (selectedPackage.category === 'Boda' && (!booking.datePrimary || !booking.dateSecondary)) {
        alert("Para bodas, por favor selecciona fecha civil y religiosa.");
        return;
    }

    const newRecord: BookingRecord = {
      id: Date.now().toString(),
      clientName: booking.clientName,
      packageId: selectedPackage.id,
      packageName: selectedPackage.name,
      totalPrice: totalPrice,
      status: 'Pendiente',
      dates: {
        primary: booking.datePrimary,
        secondary: selectedPackage.category === 'Boda' ? booking.dateSecondary : undefined
      },
      addOns: {
        canvas: booking.canvasSize,
        photobook: booking.photobookSize,
        prints: booking.printSet
      },
      timestamp: Date.now()
    };

    StorageService.addBooking(newRecord);

    const message = `Hola Xavi.ph! Soy ${booking.clientName}. Me interesa apartar el paquete: ${selectedPackage.name}. 
    \nFechas: ${booking.datePrimary} ${booking.dateSecondary ? `y ${booking.dateSecondary}` : ''}. 
    \nAdicionales: Canvas(${booking.canvasSize}), Libro(${booking.photobookSize}), Fotos(${booking.printSet}). 
    \nTotal Estimado: $${totalPrice.toLocaleString('es-MX')}.`;

    const encodedMessage = encodeURIComponent(message);
    const waLink = `https://wa.me/525615567863?text=${encodedMessage}`;

    window.open(waLink, '_blank');
    
    alert("Solicitud guardada. Se abrirá WhatsApp para finalizar el apartado.");
    // Reset
    setBooking({
        canvasSize: 'none',
        photobookSize: 'none',
        printSet: 'none',
        clientName: '',
        datePrimary: '',
        dateSecondary: '',
    });
    setViewState('categories');
    setSelectedPackage(null);
  };

  // Helper to pick icons
  const getIconForCategory = (cat: string) => {
      const lower = cat.toLowerCase();
      if (lower.includes('boda')) return Heart;
      if (lower.includes('xv') || lower.includes('quince')) return Star;
      if (lower.includes('retrato') || lower.includes('studio')) return Camera;
      if (lower.includes('evento') || lower.includes('fiesta')) return Music;
      return Aperture;
  };

  return (
    <div className="pb-20">
      {/* Hero Section */}
      <section className="relative h-[80vh] flex items-center justify-center bg-zinc-900 text-white overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img 
            src={heroImage} 
            alt="Hero Background" 
            className="w-full h-full object-cover opacity-40"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-zinc-900"></div>
        </div>
        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto flex flex-col items-center">
          {logo && <img src={logo} alt="Xavi.Ph Logo" className="h-20 mb-6 drop-shadow-lg" />}
          <h2 className="text-sm md:text-lg uppercase tracking-[0.3em] mb-4 text-gray-300">Xavi.Ph</h2>
          <h1 className="text-4xl md:text-6xl font-serif leading-tight mb-6">
            El arte de capturar lo efímero.
          </h1>
          <p className="text-lg md:text-xl font-light text-gray-300 italic">
            Fotografía exclusiva para quienes valoran el legado.
          </p>
        </div>
      </section>

      {/* Calendar Preview Section */}
      <section className="py-12 bg-white border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center space-x-2 mb-6">
            <CalendarIcon className="w-5 h-5 text-gray-400" />
            <h3 className="text-lg font-serif">Fechas Reservadas</h3>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar">
             {acceptedBookings.length === 0 ? (
                 <p className="text-gray-400 text-sm">Calendario disponible. ¡Aparta tu fecha hoy!</p>
             ) : (
                 acceptedBookings.map(b => (
                     <div key={b.id} className="min-w-[150px] p-3 bg-gray-50 border border-gray-100 rounded text-center">
                         <p className="text-xs text-gray-500 uppercase">{b.packageName}</p>
                         <p className="font-bold text-gray-800">{b.dates.primary}</p>
                         {b.dates.secondary && <p className="text-xs text-gray-400">& {b.dates.secondary}</p>}
                         <span className="inline-block mt-2 px-2 py-0.5 bg-gray-200 text-gray-600 text-[10px] rounded-full">Ocupada</span>
                     </div>
                 ))
             )}
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <section className="py-20 px-4 bg-gray-50" id="experiencias">
        <div className="max-w-7xl mx-auto">
            
            {/* VIEW 1: CATEGORIES */}
            {viewState === 'categories' && (
                <div className="animate-fade-in">
                    <h2 className="text-3xl md:text-4xl font-serif text-center mb-4">Experiencias & Colecciones</h2>
                    <p className="text-center text-gray-500 mb-12 max-w-2xl mx-auto">Selecciona el tipo de evento para ver nuestros paquetes exclusivos.</p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {Object.entries(catCovers).map(([catName, imgUrl]) => {
                            const Icon = getIconForCategory(catName);
                            return (
                                <div 
                                    key={catName} 
                                    onClick={() => handleCategorySelect(catName)}
                                    className="relative h-96 cursor-pointer group overflow-hidden rounded-sm shadow-lg"
                                >
                                    <img 
                                        src={imgUrl || 'https://picsum.photos/800/600'} 
                                        alt={catName} 
                                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                                    />
                                    <div className="absolute inset-0 bg-black/40 group-hover:bg-black/50 transition-colors flex flex-col items-center justify-center text-white">
                                        <Icon className="w-10 h-10 mb-4 opacity-80" strokeWidth={1} />
                                        <h3 className="text-2xl font-serif tracking-widest uppercase">{catName}</h3>
                                        <span className="mt-4 text-xs tracking-widest border-b border-transparent group-hover:border-white transition-all pb-1">VER PAQUETES</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* VIEW 2: PACKAGE LIST */}
            {viewState === 'list' && (
                <div className="animate-fade-in">
                    <div className="flex items-center mb-8">
                        <button onClick={handleBackToCategories} className="flex items-center text-sm text-gray-500 hover:text-black transition-colors">
                            <ArrowLeft className="w-4 h-4 mr-2" /> Volver a Categorías
                        </button>
                        <h2 className="text-2xl font-serif ml-auto uppercase tracking-wider">{activeCategory}</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {filteredPackages.length > 0 ? (
                            filteredPackages.map((pkg) => (
                                <div key={pkg.id} className="bg-white border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col">
                                    <div className="h-64 overflow-hidden relative">
                                        <img src={pkg.coverImage} alt={pkg.name} className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
                                        <div className="absolute top-4 right-4 bg-white/90 backdrop-blur px-3 py-1 text-xs font-bold uppercase tracking-wider">
                                            {pkg.category}
                                        </div>
                                    </div>
                                    <div className="p-8 flex flex-col flex-grow text-center">
                                        <h3 className="text-xl font-serif mb-2">{pkg.name}</h3>
                                        <p className="text-gray-500 text-sm mb-6 line-clamp-2">{pkg.description}</p>
                                        <div className="mt-auto">
                                            <button 
                                                onClick={() => handlePackageSelect(pkg)}
                                                className="w-full px-6 py-3 border border-black text-black text-xs uppercase tracking-widest hover:bg-black hover:text-white transition-colors"
                                            >
                                                Ver Detalles
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="col-span-full text-center py-20 text-gray-500">
                                <p>No hay paquetes disponibles para esta categoría.</p>
                                <button onClick={handleBackToCategories} className="mt-4 text-black underline">Volver</button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* VIEW 3: DETAILS & BOOKING */}
            {viewState === 'details' && selectedPackage && (
                <div id="booking-form" className="animate-fade-in min-h-screen bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-4 bg-gray-50 border-b border-gray-100">
                         <button onClick={handleBackToList} className="flex items-center text-sm text-gray-500 hover:text-black transition-colors">
                            <ArrowLeft className="w-4 h-4 mr-2" /> Volver a {activeCategory}
                        </button>
                    </div>
                    
                    <div className="p-8 lg:p-12">
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-12">
                        
                        {/* Left Column: Package Details & Locations */}
                        <div className="md:col-span-7 space-y-12">
                            <div>
                                <h3 className="text-4xl font-serif mb-2">{selectedPackage.name}</h3>
                                <p className="text-2xl font-bold text-gray-900 mb-4">${selectedPackage.price.toLocaleString('es-MX')}</p>
                                <p className="text-gray-500 mb-6 text-lg leading-relaxed">{selectedPackage.description}</p>
                                
                                <div className="bg-gray-50 p-6 rounded-lg border border-gray-100">
                                    <h4 className="font-bold text-sm uppercase tracking-wide mb-4 text-gray-400">Este paquete incluye:</h4>
                                    <ul className="grid grid-cols-1 gap-3">
                                        {selectedPackage.includes.map((item, idx) => (
                                            <li key={idx} className="flex items-start text-sm text-gray-700">
                                                <Check className="w-4 h-4 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                                                {item}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>

                            <Calculator 
                                basePackage={selectedPackage}
                                bookingState={booking}
                                onChange={handleBookingChange}
                                onTotalChange={setTotalPrice}
                            />

                            <div className="pt-8 border-t border-gray-100">
                                <h4 className="text-2xl font-serif mb-6">Locaciones CDMX Sugeridas</h4>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {LOCATIONS.map((loc, idx) => (
                                        <a 
                                            key={idx} 
                                            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(loc.name + ' CDMX')}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="bg-zinc-800 p-4 rounded border border-zinc-700 hover:border-gray-500 hover:bg-zinc-700 transition-all cursor-pointer group block"
                                        >
                                            <div className="flex items-start mb-2 justify-between">
                                                <div className="flex items-center">
                                                    <MapPin className="w-4 h-4 text-gray-100 mr-2 mt-1 group-hover:text-white" />
                                                    <h5 className="font-serif text-white group-hover:underline">{loc.name}</h5>
                                                </div>
                                                <ExternalLink className="w-3 h-3 text-gray-400 group-hover:text-white" />
                                            </div>
                                            <p className="text-xs text-gray-400 pl-6 group-hover:text-gray-300">{loc.description}</p>
                                        </a>
                                    ))}
                                </div>
                                <p className="text-xs text-gray-500 mt-4 italic">* Costos de permisos no incluidos.</p>
                            </div>
                        </div>

                        {/* Right Column: Booking Form */}
                        <div className="md:col-span-5">
                            <div className="bg-gray-50 p-8 rounded-xl border border-gray-100 sticky top-24 shadow-lg">
                                <h3 className="text-xl font-serif mb-6 flex items-center">
                                    <CalendarIcon className="w-5 h-5 mr-2" />
                                    Reservar Fecha
                                </h3>
                                
                                <form onSubmit={handleBookingSubmit} className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Nombre Completo</label>
                                        <input 
                                            type="text" 
                                            required
                                            className="w-full p-3 border border-gray-300 rounded-md focus:ring-1 focus:ring-gray-900 outline-none"
                                            placeholder="Ej. Ana & Carlos"
                                            value={booking.clientName}
                                            onChange={(e) => handleBookingChange('clientName', e.target.value)}
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            {selectedPackage.category === 'Boda' ? 'Fecha Boda Civil' : 'Fecha del Evento'}
                                        </label>
                                        <input 
                                            type="date" 
                                            required
                                            className="w-full p-3 border border-gray-300 rounded-md outline-none"
                                            value={booking.datePrimary}
                                            onChange={(e) => handleBookingChange('datePrimary', e.target.value)}
                                        />
                                    </div>

                                    {selectedPackage.category === 'Boda' && (
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Fecha Boda Religiosa</label>
                                            <input 
                                                type="date" 
                                                required
                                                className="w-full p-3 border border-gray-300 rounded-md outline-none"
                                                value={booking.dateSecondary}
                                                onChange={(e) => handleBookingChange('dateSecondary', e.target.value)}
                                            />
                                        </div>
                                    )}

                                    <div className="pt-4">
                                        <button 
                                            type="submit"
                                            className="w-full bg-green-600 hover:bg-green-700 text-white py-4 rounded-md font-bold text-lg flex items-center justify-center transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                                        >
                                            <Phone className="w-5 h-5 mr-2" />
                                            Apartar Fecha por WhatsApp
                                        </button>
                                        <p className="text-center text-xs text-gray-400 mt-2">
                                            Al hacer clic, se guardará tu pre-reserva y abrirá WhatsApp.
                                        </p>
                                    </div>
                                </form>
                            </div>
                        </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
      </section>

      {/* Portfolio Section */}
      <section className="py-20 bg-gray-50 border-t border-gray-100 border-dashed">
         <div className="max-w-7xl mx-auto px-4">
            <h2 className="text-3xl font-serif text-center mb-8">Galería de Trabajos</h2>

            {/* Portfolio Categories */}
            <div className="flex justify-center flex-wrap gap-4 mb-12">
                {portCategories.map(cat => (
                    <button 
                        key={cat}
                        onClick={() => setActivePortCategory(cat)}
                        className={`px-4 py-1.5 rounded-full text-xs tracking-wider uppercase border transition-all duration-300 ${activePortCategory === cat ? 'bg-zinc-800 text-white border-zinc-800' : 'bg-white text-gray-500 border-gray-200 hover:border-gray-400'}`}
                    >
                        {cat}
                    </button>
                ))}
            </div>

            {filteredPortfolio.length === 0 ? (
                <p className="text-center text-gray-400">Aún no hay fotos en esta categoría.</p>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {filteredPortfolio.map((item) => (
                        <div key={item.id} className="relative aspect-square overflow-hidden rounded group cursor-pointer">
                            <img src={item.url} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                                <div>
                                    <p className="text-white text-xs font-bold uppercase tracking-wider">{item.category}</p>
                                    {item.title && <p className="text-gray-300 text-[10px]">{item.title}</p>}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
         </div>
      </section>
    </div>
  );
};

export default Home;