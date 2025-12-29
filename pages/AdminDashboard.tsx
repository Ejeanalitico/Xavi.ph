import React, { useState, useEffect } from 'react';
import { StorageService, DEFAULT_CATEGORY_IMAGES } from '../services/storageService';
import { BookingRecord, VisitorStat, Package, AddOnOptions, AddOnLabels, ClientUser, PortfolioItem, ExperienceCategory } from '../types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { CheckCircle, XCircle, Clock, Save, Image as ImageIcon, Plus, Trash, Users, Calendar, Upload, Edit2, Camera, Eye, X, Cloud, Layout } from 'lucide-react';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];
const DRIVE_LINK = "https://drive.google.com/drive/folders/1EnlqnYyoe1SC2pJ71XvtjVs2eTnVRKQG?usp=sharing";

const AdminDashboard: React.FC<{ onLogout: () => void }> = ({ onLogout }) => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'bookings' | 'cms'>('dashboard');
  const [bookings, setBookings] = useState<BookingRecord[]>([]);
  const [clients, setClients] = useState<ClientUser[]>([]);
  const [resolvedImages, setResolvedImages] = useState<Record<string, string>>({});
  
  // Selection Viewer
  const [viewingClientSelection, setViewingClientSelection] = useState<ClientUser | null>(null);
  
  // Stats
  const [trafficFreq, setTrafficFreq] = useState<'weekly' | 'monthly' | 'yearly'>('weekly');
  const [stats, setStats] = useState<{ 
      visits: VisitorStat[], 
      sources: VisitorStat[], 
      topCategories: VisitorStat[], 
      topPackages: VisitorStat[] 
  }>({ visits: [], sources: [], topCategories: [], topPackages: [] });

  // CMS
  const [packages, setPackages] = useState<Package[]>([]);
  const [addons, setAddons] = useState<AddOnOptions | null>(null);
  const [addonLabels, setAddonLabels] = useState<AddOnLabels | null>(null);
  const [catCovers, setCatCovers] = useState<Record<string, string>>(StorageService.getCategoryCovers());
  const [newCatName, setNewCatName] = useState('');
  const [homeHero, setHomeHero] = useState<string>('');
  
  const [newPackage, setNewPackage] = useState<Partial<Package>>({ category: 'Retrato', includes: [] });
  const [isAddingPkg, setIsAddingPkg] = useState(false);
  
  // Uploads
  const [newClient, setNewClient] = useState<ClientUser>({ email: '', password: '', galleryImages: [] });
  const [portfolioPhotos, setPortfolioPhotos] = useState<PortfolioItem[]>([]);
  const [clientPhotoUpload, setClientPhotoUpload] = useState<FileList | null>(null);
  const [portfolioUpload, setPortfolioUpload] = useState<FileList | null>(null);
  const [portfolioCategory, setPortfolioCategory] = useState<string>('General');
  const [isUploadingToDrive, setIsUploadingToDrive] = useState(false);

  useEffect(() => {
    refreshData();
  }, [trafficFreq]);

  const refreshData = async () => {
    setBookings(StorageService.getBookings());
    setStats(StorageService.getTrafficStats(trafficFreq));
    setPackages(StorageService.getPackages());
    setAddons(StorageService.getAddonPrices());
    setAddonLabels(StorageService.getAddonLabels());
    
    // Resolve Async Portfolio Images
    const rawPort = StorageService.getPortfolio();
    const resolvedPort = await Promise.all(rawPort.map(async (p) => ({
        ...p,
        url: await StorageService.resolveImage(p.url)
    })));
    setPortfolioPhotos(resolvedPort);
    
    // Resolve Category Covers
    const rawCovers = StorageService.getCategoryCovers();
    const resolvedCovers: Record<string, string> = {};
    for (const [key, val] of Object.entries(rawCovers)) {
        resolvedCovers[key] = await StorageService.resolveImage(val);
    }
    setCatCovers(resolvedCovers);

    // Resolve Home Hero
    setHomeHero(await StorageService.getHomeHero());

    setClients(StorageService.getClients());
  };

  const handleStatusChange = (id: string, status: BookingRecord['status']) => {
    StorageService.updateBookingStatus(id, status);
    setBookings(StorageService.getBookings());
  };

  const processFiles = async (files: FileList): Promise<string[]> => {
      const promises: Promise<string>[] = [];
      for (let i = 0; i < files.length; i++) {
          const file = files[i];
          promises.push(new Promise((resolve) => {
              const reader = new FileReader();
              reader.onload = (e) => resolve(e.target?.result as string);
              reader.readAsDataURL(file);
          }));
      }
      return Promise.all(promises);
  };

  const getGoogleCalendarUrl = (booking: BookingRecord) => {
    const start = booking.dates.primary.replace(/-/g, '');
    const end = booking.dates.primary.replace(/-/g, ''); 
    const title = encodeURIComponent(`Boda/Evento: ${booking.clientName}`);
    const details = encodeURIComponent(`Paquete: ${booking.packageName}. Notas: ${JSON.stringify(booking.addOns)}`);
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${start}/${end}&details=${details}`;
  };

  // --- Handlers ---

  const handleUpdatePackage = (pkg: Package) => {
    StorageService.updatePackage(pkg);
    setPackages(StorageService.getPackages());
    alert('Paquete actualizado');
  };

  const handleDeletePackage = (id: string) => {
      if(confirm('¿Seguro de eliminar este paquete?')) {
          StorageService.deletePackage(id);
          setPackages(StorageService.getPackages());
      }
  };

  const handleAddPackage = async () => {
    if (newPackage.name && newPackage.price) {
        const pkg: Package = {
            id: `pkg_${Date.now()}`,
            name: newPackage.name,
            price: Number(newPackage.price),
            description: newPackage.description || '',
            includes: newPackage.includes || [],
            category: (newPackage.category as ExperienceCategory) || 'Retrato',
            coverImage: newPackage.coverImage || 'https://picsum.photos/800/600'
        };
        StorageService.addPackage(pkg);
        setPackages(StorageService.getPackages());
        setIsAddingPkg(false);
        setNewPackage({ category: 'Retrato', includes: [] });
    }
  };

  const handleAddClient = async () => {
    if (newClient.email && newClient.password) {
        setIsUploadingToDrive(true);
        let images: string[] = [];
        if (clientPhotoUpload) {
            images = await processFiles(clientPhotoUpload);
        }
        
        // Simulate Network Delay for Drive Upload
        setTimeout(async () => {
            const clientData = { ...newClient, galleryImages: images };
            await StorageService.addClient(clientData);
            setIsUploadingToDrive(false);
            alert('Cliente registrado. Fotos guardadas y sincronizadas con carpeta Drive (Simulación).');
            setNewClient({ email: '', password: '', galleryImages: [] });
            setClientPhotoUpload(null);
            setClients(StorageService.getClients());
        }, 1500);
    }
  };
  
  const handleDeleteClient = (email: string) => {
      if(confirm('¿Seguro de eliminar este cliente?')) {
          StorageService.removeClient(email);
          setClients(StorageService.getClients());
      }
  };

  const handleUploadPortfolio = async () => {
      if (portfolioUpload) {
          const images = await processFiles(portfolioUpload);
          for (const img of images) {
              await StorageService.addToPortfolio({
                  id: `port_${Date.now()}_${Math.random()}`,
                  url: img,
                  title: 'Nuevo Trabajo',
                  category: portfolioCategory
              });
          }
          refreshData(); // Re-fetch to resolve images
          setPortfolioUpload(null);
          alert('Fotos agregadas al portafolio');
      }
  };

  const handleDeletePortfolioItem = async (id: string) => {
      if (confirm('¿Eliminar esta foto del portafolio?')) {
          await StorageService.removePortfolioItem(id);
          refreshData();
      }
  };

  const handleCatCoverUpload = async (cat: string, files: FileList | null) => {
      if (files && files[0]) {
          const base64 = await processFiles(files);
          await StorageService.updateCategoryCover(cat, base64[0]);
          refreshData();
      }
  };
  
  const handleHomeHeroUpload = async (files: FileList | null) => {
      if (files && files[0]) {
          const base64 = await processFiles(files);
          await StorageService.updateHomeHero(base64[0]);
          refreshData();
      }
  };

  const handleAddCategory = async () => {
      if (!newCatName.trim()) return;
      // Add with a placeholder image
      await StorageService.updateCategoryCover(newCatName, 'https://picsum.photos/800/600');
      setNewCatName('');
      refreshData();
  };
  
  const handleDeleteCategory = (cat: string) => {
      if (confirm(`¿Eliminar categoría "${cat}"? Los paquetes asociados podrían quedar ocultos.`)) {
          StorageService.deleteCategory(cat);
          refreshData();
      }
  };

  const handleSaveAddons = () => {
    if (addons && addonLabels) {
        StorageService.updateAddonPrices(addons);
        StorageService.updateAddonLabels(addonLabels);
        alert('Configuración de adicionales actualizada');
    }
  };

  // Helper to load client images for viewing
  const loadClientImagesForView = async (client: ClientUser) => {
      if (!client.selectedPhotos) return;
      const images: Record<string, string> = {};
      
      // We need to resolve all gallery images to find the selected ones
      // This might be heavy, so we only do it on click
      for (const id of client.selectedPhotos) {
          // Parse index from ID: real-photo-X
          const idx = parseInt(id.split('-').pop() || '-1');
          if (idx >= 0 && client.galleryImages[idx]) {
              const url = await StorageService.resolveImage(client.galleryImages[idx]);
              images[id] = url;
          }
      }
      setResolvedImages(images);
      setViewingClientSelection(client);
  };

  return (
    <div className="min-h-screen bg-black flex font-sans text-gray-200">
      <aside className="w-64 bg-zinc-900 text-white hidden md:block flex-shrink-0 border-r border-zinc-800">
        <div className="p-6">
          <h2 className="text-xl font-serif">Xavi.Ph Admin</h2>
        </div>
        <nav className="mt-6">
          <button onClick={() => setActiveTab('dashboard')} className={`w-full text-left px-6 py-3 hover:bg-zinc-800 ${activeTab === 'dashboard' ? 'bg-zinc-800 border-l-4 border-white' : ''}`}>Monitor de Tráfico</button>
          <button onClick={() => setActiveTab('bookings')} className={`w-full text-left px-6 py-3 hover:bg-zinc-800 ${activeTab === 'bookings' ? 'bg-zinc-800 border-l-4 border-white' : ''}`}>Reservas</button>
          <button onClick={() => setActiveTab('cms')} className={`w-full text-left px-6 py-3 hover:bg-zinc-800 ${activeTab === 'cms' ? 'bg-zinc-800 border-l-4 border-white' : ''}`}>CMS & Logos</button>
          <button onClick={onLogout} className="w-full text-left px-6 py-3 hover:bg-red-900 text-red-200 mt-10">Cerrar Sesión</button>
        </nav>
      </aside>

      <main className="flex-1 p-8 overflow-y-auto max-h-screen">
        {/* DASHBOARD */}
        {activeTab === 'dashboard' && (
          <div className="space-y-8 animate-fade-in">
             <div className="bg-zinc-900 rounded-lg shadow-sm border border-zinc-800 overflow-hidden">
                <div className="bg-zinc-900 px-6 py-4 border-b border-zinc-800 flex justify-between items-center">
                    <h2 className="text-lg font-bold text-white">Resumen de Actividad</h2>
                    <div className="flex bg-zinc-800 rounded border border-zinc-700 overflow-hidden text-xs shadow-sm">
                        <button onClick={() => setTrafficFreq('weekly')} className={`px-4 py-2 ${trafficFreq === 'weekly' ? 'bg-white text-black' : 'text-gray-400'}`}>Semanal</button>
                        <button onClick={() => setTrafficFreq('monthly')} className={`px-4 py-2 border-l border-r border-zinc-700 ${trafficFreq === 'monthly' ? 'bg-white text-black' : 'text-gray-400'}`}>Mensual</button>
                    </div>
                </div>
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                     {/* Visits */}
                     <div className="border border-zinc-800 p-4 rounded-lg bg-zinc-900 shadow-sm" style={{ minHeight: '300px' }}>
                        <h4 className="text-gray-400 text-xs mb-4 font-bold uppercase">Visitas</h4>
                        <div style={{ width: '100%', height: 250 }}>
                            <ResponsiveContainer>
                                <BarChart data={stats.visits}>
                                    <XAxis dataKey="name" fontSize={11} tickLine={false} axisLine={false} stroke="#666" />
                                    <YAxis fontSize={11} tickLine={false} axisLine={false} stroke="#666" />
                                    <Tooltip contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', color: '#fff' }} itemStyle={{ color: '#fff' }} />
                                    <Bar dataKey="value" fill="#fff" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                     </div>
                     
                     {/* Sources */}
                     <div className="border border-zinc-800 p-4 rounded-lg bg-zinc-900 shadow-sm" style={{ minHeight: '300px' }}>
                        <h4 className="text-gray-400 text-xs mb-4 font-bold uppercase">Fuentes (Real)</h4>
                        {stats.sources.length > 0 ? (
                            <div style={{ width: '100%', height: 250 }}>
                                <ResponsiveContainer>
                                    <PieChart>
                                        <Pie data={stats.sources} cx="50%" cy="50%" innerRadius={60} outerRadius={80} dataKey="value" paddingAngle={5}>
                                            {stats.sources.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                                        </Pie>
                                        <Tooltip contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', color: '#fff' }} itemStyle={{ color: '#fff' }} />
                                    </PieChart>
                                </ResponsiveContainer>
                                <div className="flex flex-wrap justify-center gap-2 mt-2">
                                    {stats.sources.map((s, i) => (
                                        <span key={i} className="text-[10px] flex items-center text-gray-300">
                                            <span className="w-2 h-2 rounded-full mr-1" style={{backgroundColor: COLORS[i % COLORS.length]}}></span>
                                            {s.name}: {s.value}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-center justify-center h-full text-gray-600 text-sm">Sin datos de fuentes aún</div>
                        )}
                     </div>

                     {/* Top Categories */}
                     <div className="border border-zinc-800 p-4 rounded-lg bg-zinc-900 shadow-sm">
                        <h4 className="text-gray-400 text-xs mb-4 font-bold uppercase">Top Categorías</h4>
                        <ul className="space-y-2">
                            {stats.topCategories.length > 0 ? stats.topCategories.map((c, i) => (
                                <li key={i} className="flex justify-between text-sm border-b border-zinc-800 pb-1 text-gray-300">
                                    <span>{c.name}</span>
                                    <span className="font-bold text-white">{c.value} clics</span>
                                </li>
                            )) : <li className="text-gray-600 text-sm">Sin datos aún</li>}
                        </ul>
                     </div>

                     {/* Top Packages */}
                     <div className="border border-zinc-800 p-4 rounded-lg bg-zinc-900 shadow-sm">
                        <h4 className="text-gray-400 text-xs mb-4 font-bold uppercase">Paquetes Más Vistos</h4>
                         <ul className="space-y-2">
                            {stats.topPackages.length > 0 ? stats.topPackages.map((p, i) => (
                                <li key={i} className="flex justify-between text-sm border-b border-zinc-800 pb-1 text-gray-300">
                                    <span>{p.name}</span>
                                    <span className="font-bold text-white">{p.value} vistas</span>
                                </li>
                            )) : <li className="text-gray-600 text-sm">Sin datos aún</li>}
                        </ul>
                     </div>
                </div>
             </div>
          </div>
        )}

        {/* BOOKINGS */}
        {activeTab === 'bookings' && (
          <div>
            <h2 className="text-2xl font-bold text-white mb-6">Gestión de Reservas</h2>
            <div className="bg-zinc-900 shadow-sm rounded-lg overflow-hidden border border-zinc-800">
                <table className="min-w-full divide-y divide-zinc-800">
                    <thead className="bg-zinc-800">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-bold text-gray-400 uppercase">Cliente</th>
                            <th className="px-6 py-3 text-left text-xs font-bold text-gray-400 uppercase">Paquete</th>
                            <th className="px-6 py-3 text-left text-xs font-bold text-gray-400 uppercase">Fechas</th>
                            <th className="px-6 py-3 text-left text-xs font-bold text-gray-400 uppercase">Total</th>
                            <th className="px-6 py-3 text-left text-xs font-bold text-gray-400 uppercase">Estado</th>
                            <th className="px-6 py-3 text-left text-xs font-bold text-gray-400 uppercase">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="bg-zinc-900 divide-y divide-zinc-800 text-gray-300">
                        {bookings.map((booking) => (
                            <tr key={booking.id}>
                                <td className="px-6 py-4"><div className="text-sm font-bold text-white">{booking.clientName}</div></td>
                                <td className="px-6 py-4 text-sm">{booking.packageName}</td>
                                <td className="px-6 py-4 text-sm">{booking.dates.primary}</td>
                                <td className="px-6 py-4 text-sm font-bold text-white">${booking.totalPrice.toLocaleString()}</td>
                                <td className="px-6 py-4">
                                    <select 
                                        className="text-xs border border-zinc-700 bg-zinc-800 text-white rounded px-2 py-1"
                                        value={booking.status}
                                        onChange={(e) => handleStatusChange(booking.id, e.target.value as any)}
                                    >
                                        <option value="Pendiente">Pendiente</option>
                                        <option value="Aceptada">Aceptada</option>
                                        <option value="Rechazada">Rechazada</option>
                                    </select>
                                </td>
                                <td className="px-6 py-4 text-sm">
                                    {booking.status === 'Aceptada' && (
                                        <a 
                                            href={getGoogleCalendarUrl(booking)} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="text-blue-400 hover:text-blue-300 flex items-center bg-zinc-800 px-2 py-1 rounded border border-zinc-700 hover:bg-zinc-700 transition-colors"
                                            title="Agregar a Google Calendar"
                                        >
                                            <Calendar className="w-4 h-4 mr-1" />
                                            <span className="text-xs font-semibold">G-Cal</span>
                                        </a>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
        )}

        {/* CMS */}
        {activeTab === 'cms' && (
            <div className="space-y-8 animate-fade-in">
                
                {/* CATEGORY COVERS & HOME HERO */}
                <div className="bg-zinc-900 p-6 rounded shadow-sm border border-zinc-800">
                    <h3 className="text-lg font-bold mb-4 flex items-center text-white">
                        <Layout className="mr-2 w-5 h-5" /> Portada Principal y Categorías
                    </h3>

                    {/* Home Hero Editor */}
                    <div className="mb-8 border-b border-zinc-800 pb-8">
                        <label className="block text-sm font-bold text-gray-400 mb-2">Portada de Inicio (Hero Image)</label>
                        <div className="relative h-48 bg-zinc-800 rounded overflow-hidden group">
                             <img src={homeHero} className="w-full h-full object-cover" alt="Home Hero" />
                             <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <label className="cursor-pointer bg-white text-black px-4 py-2 rounded shadow-sm font-bold text-sm hover:bg-gray-200">
                                    <Upload className="w-4 h-4 inline mr-2" />
                                    Cambiar Portada
                                    <input type="file" className="hidden" onChange={(e) => handleHomeHeroUpload(e.target.files)} accept="image/*" />
                                </label>
                             </div>
                        </div>
                    </div>
                    
                    {/* Add Category Input */}
                    <div className="mb-4">
                        <label className="block text-sm font-bold text-gray-400 mb-2">Categorías</label>
                        <div className="flex gap-2">
                            <input 
                                type="text" 
                                placeholder="Nombre de nueva categoría..." 
                                className="border border-zinc-700 bg-zinc-800 text-white rounded px-4 py-2 text-sm flex-1 focus:ring-1 focus:ring-white outline-none"
                                value={newCatName}
                                onChange={(e) => setNewCatName(e.target.value)}
                            />
                            <button 
                                onClick={handleAddCategory}
                                className="bg-white text-black px-4 py-2 rounded text-sm font-bold hover:bg-gray-200"
                            >
                                + Agregar
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {Object.entries(catCovers).map(([cat, url]) => (
                            <div key={cat} className="group relative aspect-video bg-zinc-800 rounded overflow-hidden border border-zinc-700">
                                <img src={url} className="w-full h-full object-cover opacity-80 group-hover:opacity-100" alt={cat} />
                                <div className="absolute top-1 right-1 z-10">
                                    <button 
                                        onClick={() => handleDeleteCategory(cat)}
                                        className="bg-red-600 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-700"
                                        title="Eliminar categoría"
                                    >
                                        <X className="w-3 h-3" />
                                    </button>
                                </div>
                                <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <span className="text-white font-bold mb-2 text-center px-2">{cat}</span>
                                    <label className="cursor-pointer bg-white text-black text-xs px-2 py-1 rounded">
                                        Cambiar
                                        <input type="file" className="hidden" onChange={(e) => handleCatCoverUpload(cat, e.target.files)} accept="image/*" />
                                    </label>
                                </div>
                                <div className="absolute bottom-0 inset-x-0 bg-black/60 text-white text-xs p-1 text-center md:hidden">
                                    {cat}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* 4. Portfolio Management (IMPROVED GRID) */}
                <div className="bg-zinc-900 p-6 rounded shadow-sm border border-zinc-800">
                     <h3 className="text-lg font-bold mb-4 flex items-center text-white">
                        <ImageIcon className="mr-2 w-5 h-5" />
                        Galería de Trabajos (Portfolio Home)
                    </h3>
                    
                    {/* Upload Section */}
                    <div className="flex flex-col md:flex-row gap-4 items-end bg-zinc-800 p-4 rounded border border-zinc-700 mb-6">
                        <div className="w-full md:w-1/3">
                            <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Categoría</label>
                            <select 
                                className="w-full border border-zinc-600 bg-zinc-700 text-white rounded p-2 text-sm focus:ring-1 focus:ring-white outline-none"
                                value={portfolioCategory}
                                onChange={(e) => setPortfolioCategory(e.target.value)}
                            >
                                {Object.keys(catCovers).map(cat => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                                {Object.keys(catCovers).length === 0 && <option value="General">General</option>}
                            </select>
                        </div>
                        <div className="flex-1 w-full">
                            <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Subir Fotos</label>
                             <input 
                                    type="file" 
                                    multiple 
                                    accept="image/*"
                                    className="w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-zinc-700 file:text-white hover:file:bg-zinc-600"
                                    onChange={(e) => setPortfolioUpload(e.target.files)}
                             />
                        </div>
                        <button onClick={handleUploadPortfolio} className="bg-white text-black px-6 py-2 rounded text-sm hover:bg-gray-200 font-bold flex items-center w-full md:w-auto justify-center">
                            <Upload className="w-4 h-4 mr-2" /> Subir al Portal
                        </button>
                    </div>

                    {/* Portfolio Grid with Delete Actions */}
                    <div className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-6 gap-3">
                        {portfolioPhotos.map(p => (
                            <div key={p.id} className="relative aspect-square bg-zinc-800 rounded overflow-hidden border border-zinc-700 group">
                                <img src={p.url} className="w-full h-full object-cover" alt="portfolio" />
                                <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button 
                                        onClick={() => handleDeletePortfolioItem(p.id)}
                                        className="bg-red-600 text-white p-1 rounded-full hover:bg-red-700 shadow-sm"
                                        title="Eliminar del portafolio"
                                    >
                                        <X className="w-3 h-3" />
                                    </button>
                                </div>
                                <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[10px] p-1 text-center truncate">
                                    {p.category}
                                </div>
                            </div>
                        ))}
                    </div>
                    {portfolioPhotos.length === 0 && (
                        <p className="text-gray-500 text-sm text-center py-8">No hay fotos en el portafolio. Sube algunas arriba.</p>
                    )}
                </div>

                {/* CLIENTS & DRIVE */}
                <div className="bg-zinc-900 p-6 rounded shadow-sm border border-zinc-800">
                    <div className="flex justify-between items-start mb-4">
                        <h3 className="text-lg font-bold flex items-center text-white">
                            <Users className="mr-2 w-5 h-5" /> Gestión de Clientes & Galerías
                        </h3>
                        <a href={DRIVE_LINK} target="_blank" rel="noopener noreferrer" className="text-xs flex items-center text-blue-400 hover:underline">
                            <Cloud className="w-3 h-3 mr-1" /> Ver Carpeta Google Drive
                        </a>
                    </div>
                    
                    <div className="bg-zinc-800 p-6 rounded border border-zinc-700 mb-6">
                        <h4 className="text-sm font-bold text-gray-300 uppercase mb-4">Registrar / Editar Cliente</h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                            <div>
                                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Email Cliente</label>
                                <input type="email" className="w-full border border-zinc-600 bg-zinc-700 text-white rounded p-2 text-sm focus:ring-1 focus:ring-white outline-none" value={newClient.email} onChange={e => setNewClient({...newClient, email: e.target.value})} />
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Contraseña Temporal</label>
                                <input type="text" className="w-full border border-zinc-600 bg-zinc-700 text-white rounded p-2 text-sm focus:ring-1 focus:ring-white outline-none" value={newClient.password} onChange={e => setNewClient({...newClient, password: e.target.value})} />
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Subir Fotos Galería</label>
                                <input type="file" multiple accept="image/*" className="w-full text-sm text-gray-400 file:bg-zinc-600 file:text-white file:border-0 file:py-1 file:px-2 file:rounded" onChange={(e) => setClientPhotoUpload(e.target.files)} />
                            </div>
                        </div>
                        <div className="flex justify-end">
                            <button 
                                onClick={handleAddClient} 
                                disabled={isUploadingToDrive}
                                className={`bg-white text-black px-6 py-2 rounded text-sm font-bold transition-colors ${isUploadingToDrive ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-200'}`}
                            >
                                {isUploadingToDrive ? 'Subiendo a Drive...' : 'Registrar Acceso & Subir Fotos'}
                            </button>
                        </div>
                    </div>

                    {/* Client List */}
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-zinc-700 text-sm border border-zinc-700">
                            <thead className="bg-zinc-800">
                                <tr>
                                    <th className="px-4 py-2 text-left text-gray-400">Email</th>
                                    <th className="px-4 py-2 text-left text-gray-400">Password</th>
                                    <th className="px-4 py-2 text-left text-gray-400">Fotos</th>
                                    <th className="px-4 py-2 text-left text-gray-400">Selección</th>
                                    <th className="px-4 py-2 text-left text-gray-400">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-700 text-gray-300">
                                {clients.map((c, i) => (
                                    <tr key={i}>
                                        <td className="px-4 py-2">{c.email}</td>
                                        <td className="px-4 py-2 font-mono text-gray-500">{c.password}</td>
                                        <td className="px-4 py-2">{c.galleryImages.length} fotos</td>
                                        <td className="px-4 py-2">
                                            {c.selectedPhotos && c.selectedPhotos.length > 0 ? (
                                                <div className="flex items-center gap-2">
                                                     <span className="text-green-500 font-bold text-xs flex items-center">
                                                        <CheckCircle className="w-3 h-3 mr-1" /> {c.selectedPhotos.length} favoritas
                                                    </span>
                                                    <button onClick={() => loadClientImagesForView(c)} className="text-xs bg-zinc-700 text-white px-2 py-0.5 rounded flex items-center hover:bg-zinc-600 border border-zinc-600">
                                                        <Eye className="w-3 h-3 mr-1" /> Ver
                                                    </button>
                                                </div>
                                            ) : <span className="text-gray-500 text-xs italic">Pendiente</span>}
                                        </td>
                                        <td className="px-4 py-2">
                                            <button onClick={() => handleDeleteClient(c.email)} className="text-red-500 hover:underline text-xs flex items-center">
                                                <Trash className="w-3 h-3 mr-1" /> Eliminar
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* SELECTION VIEWER */}
                {viewingClientSelection && (
                    <div className="bg-zinc-900 p-6 rounded shadow-sm border-2 border-green-700 relative animate-fade-in">
                        <button onClick={() => setViewingClientSelection(null)} className="absolute top-4 right-4 text-gray-400 hover:text-white"><X className="w-5 h-5" /></button>
                        <h3 className="text-lg font-bold mb-4 flex items-center text-green-500">
                            <CheckCircle className="mr-2 w-5 h-5" /> Fotos seleccionadas por {viewingClientSelection.email}
                        </h3>
                        <div className="grid grid-cols-4 md:grid-cols-6 gap-2">
                            {viewingClientSelection.selectedPhotos?.map((id, idx) => (
                                <div key={idx} className="aspect-square bg-zinc-800 rounded overflow-hidden border border-zinc-700 relative group">
                                    <img src={resolvedImages[id]} className="w-full h-full object-cover" alt="Selected" />
                                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs">{id}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* PACKAGES */}
                <div className="bg-zinc-900 p-6 rounded shadow-sm border border-zinc-800">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-bold text-white">Gestión de Paquetes</h3>
                        <button onClick={() => setIsAddingPkg(!isAddingPkg)} className="text-xs bg-white text-black hover:bg-gray-200 px-3 py-1.5 rounded flex items-center font-bold">
                            <Plus className="w-3 h-3 mr-1" /> Nuevo Paquete
                        </button>
                    </div>
                    
                    {isAddingPkg && (
                        <div className="bg-zinc-800 p-4 mb-4 rounded border border-zinc-700 text-sm space-y-3">
                            <div className="grid grid-cols-2 gap-4">
                                <input type="text" placeholder="Nombre Paquete" className="w-full border border-zinc-600 bg-zinc-700 text-white rounded p-2 focus:ring-1 focus:ring-white outline-none" value={newPackage.name || ''} onChange={e => setNewPackage({...newPackage, name: e.target.value})} />
                                <select className="w-full border border-zinc-600 bg-zinc-700 text-white rounded p-2 focus:ring-1 focus:ring-white outline-none" value={newPackage.category} onChange={e => setNewPackage({...newPackage, category: e.target.value as any})}>
                                    {Object.keys(catCovers).map(cat => (
                                        <option key={cat} value={cat}>{cat}</option>
                                    ))}
                                    {/* Fallback option if empty */}
                                    {Object.keys(catCovers).length === 0 && <option value="General">General</option>}
                                </select>
                            </div>
                            <input type="number" placeholder="Precio Base" className="w-full border border-zinc-600 bg-zinc-700 text-white rounded p-2 focus:ring-1 focus:ring-white outline-none" value={newPackage.price || ''} onChange={e => setNewPackage({...newPackage, price: Number(e.target.value)})} />
                            <textarea placeholder="Descripción" className="w-full border border-zinc-600 bg-zinc-700 text-white rounded p-2 focus:ring-1 focus:ring-white outline-none" value={newPackage.description || ''} onChange={e => setNewPackage({...newPackage, description: e.target.value})} />
                            <button onClick={handleAddPackage} className="w-full bg-green-700 hover:bg-green-600 text-white py-2 rounded font-bold">Guardar Nuevo</button>
                        </div>
                    )}

                    <div className="space-y-6 max-h-[600px] overflow-y-auto pr-2">
                        {packages.map(pkg => (
                            <div key={pkg.id} className="border border-zinc-800 p-4 rounded bg-zinc-900 shadow-sm">
                                <div className="flex justify-between items-start mb-2">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-[10px] bg-zinc-800 text-gray-300 border border-zinc-700 px-2 rounded-full uppercase font-bold">{pkg.category}</span>
                                            <input 
                                                className="font-bold text-white bg-transparent border-b border-transparent hover:border-zinc-700 focus:outline-none focus:border-white"
                                                value={pkg.name}
                                                onChange={(e) => {
                                                    const updated = packages.map(p => p.id === pkg.id ? { ...p, name: e.target.value } : p);
                                                    setPackages(updated);
                                                }}
                                            />
                                        </div>
                                        <textarea 
                                            className="w-full text-xs text-gray-400 border-transparent hover:border-zinc-700 focus:border-white border bg-transparent resize-none h-12 outline-none"
                                            value={pkg.description}
                                            onChange={(e) => {
                                                const updated = packages.map(p => p.id === pkg.id ? { ...p, description: e.target.value } : p);
                                                setPackages(updated);
                                            }}
                                        />
                                    </div>
                                    <div className="text-right">
                                        <div className="flex items-center justify-end font-bold mb-2 text-white">
                                            $<input type="number" value={pkg.price} onChange={(e) => {
                                                const updated = packages.map(p => p.id === pkg.id ? { ...p, price: Number(e.target.value) } : p);
                                                setPackages(updated);
                                            }} className="w-20 text-right bg-transparent border-b border-transparent hover:border-zinc-700 focus:outline-none focus:border-white" />
                                        </div>
                                        <button onClick={() => handleDeletePackage(pkg.id)} className="text-xs text-red-500 hover:text-red-400 underline">Eliminar</button>
                                    </div>
                                </div>
                                <div className="pt-2 border-t border-zinc-800 flex justify-end">
                                    <button onClick={() => handleUpdatePackage(pkg)} className="text-[10px] bg-white text-black px-3 py-1 rounded hover:bg-gray-200 font-bold flex items-center">
                                        <Save className="w-3 h-3 mr-1" /> Guardar
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* 5. Addons Management */}
                <div className="bg-zinc-900 p-6 rounded shadow-sm border border-zinc-800 h-fit">
                    <h3 className="text-lg font-bold mb-4 text-white">Configuración de Adicionales</h3>
                    {addons && addonLabels && (
                        <div className="space-y-6 text-sm">
                            <div>
                                <h4 className="font-medium text-gray-400 mb-2 border-b border-zinc-800 pb-1">Cuadros Canvas</h4>
                                <div className="grid grid-cols-3 gap-3">
                                    <div>
                                        <input type="text" className="text-xs text-gray-500 bg-transparent block w-full mb-1 border-b border-transparent focus:border-white outline-none" value={addonLabels.canvas.small} onChange={e => setAddonLabels({...addonLabels, canvas: {...addonLabels.canvas, small: e.target.value}})} />
                                        <input type="number" value={addons.canvas.small} onChange={e => setAddons({...addons, canvas: {...addons.canvas, small: Number(e.target.value)}})} className="border border-zinc-700 bg-zinc-800 text-white rounded p-1 w-full outline-none focus:border-white" />
                                    </div>
                                    <div>
                                        <input type="text" className="text-xs text-gray-500 bg-transparent block w-full mb-1 border-b border-transparent focus:border-white outline-none" value={addonLabels.canvas.medium} onChange={e => setAddonLabels({...addonLabels, canvas: {...addonLabels.canvas, medium: e.target.value}})} />
                                        <input type="number" value={addons.canvas.medium} onChange={e => setAddons({...addons, canvas: {...addons.canvas, medium: Number(e.target.value)}})} className="border border-zinc-700 bg-zinc-800 text-white rounded p-1 w-full outline-none focus:border-white" />
                                    </div>
                                    <div>
                                        <input type="text" className="text-xs text-gray-500 bg-transparent block w-full mb-1 border-b border-transparent focus:border-white outline-none" value={addonLabels.canvas.large} onChange={e => setAddonLabels({...addonLabels, canvas: {...addonLabels.canvas, large: e.target.value}})} />
                                        <input type="number" value={addons.canvas.large} onChange={e => setAddons({...addons, canvas: {...addons.canvas, large: Number(e.target.value)}})} className="border border-zinc-700 bg-zinc-800 text-white rounded p-1 w-full outline-none focus:border-white" />
                                    </div>
                                </div>
                            </div>
                            <div>
                                <h4 className="font-medium text-gray-400 mb-2 border-b border-zinc-800 pb-1">Photobooks</h4>
                                <div className="grid grid-cols-3 gap-3">
                                    <div>
                                        <input type="text" className="text-xs text-gray-500 bg-transparent block w-full mb-1 border-b border-transparent focus:border-white outline-none" value={addonLabels.photobook.pages20} onChange={e => setAddonLabels({...addonLabels, photobook: {...addonLabels.photobook, pages20: e.target.value}})} />
                                        <input type="number" value={addons.photobook.pages20} onChange={e => setAddons({...addons, photobook: {...addons.photobook, pages20: Number(e.target.value)}})} className="border border-zinc-700 bg-zinc-800 text-white rounded p-1 w-full outline-none focus:border-white" />
                                    </div>
                                    <div>
                                        <input type="text" className="text-xs text-gray-500 bg-transparent block w-full mb-1 border-b border-transparent focus:border-white outline-none" value={addonLabels.photobook.pages40} onChange={e => setAddonLabels({...addonLabels, photobook: {...addonLabels.photobook, pages40: e.target.value}})} />
                                        <input type="number" value={addons.photobook.pages40} onChange={e => setAddons({...addons, photobook: {...addons.photobook, pages40: Number(e.target.value)}})} className="border border-zinc-700 bg-zinc-800 text-white rounded p-1 w-full outline-none focus:border-white" />
                                    </div>
                                    <div>
                                        <input type="text" className="text-xs text-gray-500 bg-transparent block w-full mb-1 border-b border-transparent focus:border-white outline-none" value={addonLabels.photobook.pages60} onChange={e => setAddonLabels({...addonLabels, photobook: {...addonLabels.photobook, pages60: e.target.value}})} />
                                        <input type="number" value={addons.photobook.pages60} onChange={e => setAddons({...addons, photobook: {...addons.photobook, pages60: Number(e.target.value)}})} className="border border-zinc-700 bg-zinc-800 text-white rounded p-1 w-full outline-none focus:border-white" />
                                    </div>
                                </div>
                            </div>
                            <div>
                                <h4 className="font-medium text-gray-400 mb-2 border-b border-zinc-800 pb-1">Impresiones</h4>
                                <div className="grid grid-cols-3 gap-3">
                                    <div>
                                            <input type="text" className="text-xs text-gray-500 bg-transparent block w-full mb-1 border-b border-transparent focus:border-white outline-none" value={addonLabels.prints.set10} onChange={e => setAddonLabels({...addonLabels, prints: {...addonLabels.prints, set10: e.target.value}})} />
                                        <input type="number" value={addons.prints.set10} onChange={e => setAddons({...addons, prints: {...addons.prints, set10: Number(e.target.value)}})} className="border border-zinc-700 bg-zinc-800 text-white rounded p-1 w-full outline-none focus:border-white" />
                                    </div>
                                    <div>
                                            <input type="text" className="text-xs text-gray-500 bg-transparent block w-full mb-1 border-b border-transparent focus:border-white outline-none" value={addonLabels.prints.set20} onChange={e => setAddonLabels({...addonLabels, prints: {...addonLabels.prints, set20: e.target.value}})} />
                                        <input type="number" value={addons.prints.set20} onChange={e => setAddons({...addons, prints: {...addons.prints, set20: Number(e.target.value)}})} className="border border-zinc-700 bg-zinc-800 text-white rounded p-1 w-full outline-none focus:border-white" />
                                    </div>
                                    <div>
                                            <input type="text" className="text-xs text-gray-500 bg-transparent block w-full mb-1 border-b border-transparent focus:border-white outline-none" value={addonLabels.prints.set50} onChange={e => setAddonLabels({...addonLabels, prints: {...addonLabels.prints, set50: e.target.value}})} />
                                        <input type="number" value={addons.prints.set50} onChange={e => setAddons({...addons, prints: {...addons.prints, set50: Number(e.target.value)}})} className="border border-zinc-700 bg-zinc-800 text-white rounded p-1 w-full outline-none focus:border-white" />
                                    </div>
                                </div>
                            </div>
                            <button onClick={handleSaveAddons} className="w-full bg-white text-black py-3 rounded hover:bg-gray-200 flex justify-center items-center mt-6 font-bold shadow-sm">
                                <Save className="w-4 h-4 mr-2" />
                                Actualizar Precios y Etiquetas
                            </button>
                        </div>
                    )}
                </div>
            </div>
        )}
      </main>
    </div>
  );
};

export default AdminDashboard;