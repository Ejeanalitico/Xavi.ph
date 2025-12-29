import React, { useState, useEffect } from 'react';
import { StorageService } from '../services/storageService';
import { Heart, LogOut, Check } from 'lucide-react';

// Fallback if no photos uploaded
const MOCK_PHOTOS = Array.from({ length: 6 }, (_, i) => ({
  id: `photo-${i}`,
  url: `https://picsum.photos/seed/${i + 500}/600/800`,
  selected: false
}));

const ClientGallery: React.FC<{ clientEmail: string, onLogout: () => void }> = ({ clientEmail, onLogout }) => {
  const [photos, setPhotos] = useState<{id: string, url: string, selected: boolean}[]>([]);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    const loadPhotos = async () => {
        const client = StorageService.getClientByEmail(clientEmail);
        if (client && client.galleryImages && client.galleryImages.length > 0) {
            // Load real photos async
            const loadedPhotos = await Promise.all(client.galleryImages.map(async (key, idx) => {
                const url = await StorageService.resolveImage(key);
                return {
                    id: `real-photo-${idx}`,
                    url: url,
                    selected: client.selectedPhotos ? client.selectedPhotos.includes(`real-photo-${idx}`) : false
                };
            }));
            setPhotos(loadedPhotos);
        } else {
            setPhotos(MOCK_PHOTOS);
        }
    };
    loadPhotos();
  }, [clientEmail]);

  const toggleHeart = (id: string) => {
    if (submitted) return;
    setPhotos(photos.map(p => p.id === id ? { ...p, selected: !p.selected } : p));
  };

  const saveSelection = () => {
    const selectedIds = photos.filter(p => p.selected).map(p => p.id);
    if (selectedIds.length === 0) {
        alert("Selecciona al menos una foto.");
        return;
    }
    
    StorageService.sendGallerySelection(clientEmail, selectedIds);
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-white">
        <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-gray-100 px-6 py-4 flex justify-between items-center">
            <div>
                <h1 className="font-serif text-xl text-gray-900">Galería Privada</h1>
                <p className="text-xs text-gray-500">Bienvenido/a</p>
            </div>
            <div className="flex items-center space-x-4">
                <div className="text-sm mr-2 hidden sm:block">
                    {photos.filter(p => p.selected).length} Seleccionadas
                </div>
                {!submitted ? (
                    <button 
                        onClick={saveSelection}
                        className="bg-gray-900 text-white px-4 py-2 rounded text-sm hover:bg-gray-800"
                    >
                        Confirmar Selección
                    </button>
                ) : (
                    <span className="text-green-600 flex items-center text-sm font-bold">
                        <Check className="w-4 h-4 mr-1" /> Enviado
                    </span>
                )}
                <button onClick={onLogout} className="text-gray-400 hover:text-red-500">
                    <LogOut className="w-5 h-5" />
                </button>
            </div>
        </header>

        <main className="p-4 max-w-7xl mx-auto">
            {submitted && (
                <div className="mb-8 bg-green-50 border border-green-200 p-4 rounded-lg text-center text-green-800">
                    ¡Gracias! Tu selección ha sido enviada. El administrador (Xavi) ha recibido tu lista de favoritos para edición.
                </div>
            )}

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {photos.map((photo) => (
                    <div key={photo.id} className="relative group aspect-[3/4] overflow-hidden bg-gray-100 rounded-sm">
                        <img 
                            src={photo.url} 
                            alt="Gallery item" 
                            className={`w-full h-full object-cover transition-all duration-500 ${photo.selected ? 'scale-95' : 'group-hover:scale-105'}`}
                        />
                        {/* Overlay Gradient */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        
                        {/* Dense Repeated Watermark Pattern */}
                        <div className="absolute inset-0 opacity-20 pointer-events-none select-none overflow-hidden grid grid-cols-3 grid-rows-6 gap-4 p-2 transform -rotate-12">
                             {Array.from({length: 18}).map((_, i) => (
                                 <span key={i} className="text-white text-xs md:text-sm font-serif whitespace-nowrap flex items-center justify-center">Xavi.Ph Proof</span>
                             ))}
                        </div>

                        {/* Heart Button */}
                        <button 
                            onClick={() => toggleHeart(photo.id)}
                            className="absolute bottom-4 right-4 z-10 p-2 rounded-full transition-all transform hover:scale-110 focus:outline-none"
                        >
                            <Heart 
                                className={`w-8 h-8 drop-shadow-md ${photo.selected ? 'fill-red-500 text-red-500' : 'text-white fill-transparent hover:fill-white/50'}`} 
                                strokeWidth={1.5}
                            />
                        </button>
                    </div>
                ))}
            </div>
        </main>
    </div>
  );
};

export default ClientGallery;